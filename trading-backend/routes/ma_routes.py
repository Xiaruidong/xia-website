from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import pandas as pd
from datetime import datetime

router = APIRouter()

# 商品代码映射
SYMBOL_MAP = {
    'gold': 'GC=F',
    'gold_etf': 'GLD',
    'silver': 'SI=F',
    'oil': 'CL=F',
    'copper': 'HG=F',
}

class MAResponse(BaseModel):
    symbol: str
    current_price: float
    ma_short: float
    ma_medium: float
    ma_long: float
    signal: str  # bullish, bearish, neutral
    signal_text: str
    update_time: str

@router.get("/ma/{symbol}")
async def get_moving_averages(
    symbol: str,
    short: int = 5,
    medium: int = 20,
    long: int = 60
):
    """
    获取移动平均线数据和交易信号

    参数:
    - symbol: 商品代码
    - short: 短期均线周期 (默认5)
    - medium: 中期均线周期 (默认20)
    - long: 长期均线周期 (默认60)
    """
    try:
        ticker_symbol = SYMBOL_MAP.get(symbol.lower(), symbol.upper())
        ticker = yf.Ticker(ticker_symbol)

        # 获取足够的历史数据来计算长期均线
        # 至少需要long天的数据，加上一些缓冲
        data = ticker.history(period=f"{long + 10}d", interval='1d')

        if data.empty or len(data) < long:
            raise HTTPException(
                status_code=404,
                detail=f"数据不足，需要至少{long}天的历史数据"
            )

        # 计算移动平均线
        ma_short_value = data['Close'].tail(short).mean()
        ma_medium_value = data['Close'].tail(medium).mean()
        ma_long_value = data['Close'].tail(long).mean()

        # 当前价格
        current_price = data['Close'].iloc[-1]

        # 生成交易信号
        signal, signal_text = generate_signal(
            current_price,
            ma_short_value,
            ma_medium_value,
            ma_long_value
        )

        return MAResponse(
            symbol=symbol,
            current_price=round(current_price, 2),
            ma_short=round(ma_short_value, 2),
            ma_medium=round(ma_medium_value, 2),
            ma_long=round(ma_long_value, 2),
            signal=signal,
            signal_text=signal_text,
            update_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"计算均线失败: {str(e)}")

def generate_signal(price, ma_short, ma_medium, ma_long):
    """
    根据均线关系生成交易信号

    信号逻辑:
    - 看涨: 短期均线 > 中期均线 > 长期均线
    - 看跌: 短期均线 < 中期均线 < 长期均线
    - 中性: 其他情况
    """
    if ma_short > ma_medium > ma_long:
        return "bullish", "看涨 - 均线多头排列，考虑买入"
    elif ma_short < ma_medium < ma_long:
        return "bearish", "看跌 - 均线空头排列，考虑卖出"
    elif ma_short > ma_medium and price > ma_short:
        return "bullish", "看涨 - 价格站上短期均线"
    elif ma_short < ma_medium and price < ma_short:
        return "bearish", "看跌 - 价格跌破短期均线"
    else:
        return "neutral", "中性 - 等待明确信号"

@router.get("/ma/{symbol}/detail")
async def get_ma_detail(
    symbol: str,
    period: str = "3mo",
    ma_periods: str = "5,10,20,60"
):
    """
    获取详细的均线数据（用于绘制图表）

    参数:
    - symbol: 商品代码
    - period: 历史数据周期
    - ma_periods: 逗号分隔的均线周期列表
    """
    try:
        ticker_symbol = SYMBOL_MAP.get(symbol.lower(), symbol.upper())
        ticker = yf.Ticker(ticker_symbol)

        # 获取历史数据
        data = ticker.history(period=period, interval='1d')

        if data.empty:
            raise HTTPException(status_code=404, detail="无法获取历史数据")

        # 解析均线周期
        periods = [int(p.strip()) for p in ma_periods.split(',')]

        # 计算各周期均线
        ma_data = {}
        for period in periods:
            if len(data) >= period:
                ma_data[f'MA{period}'] = data['Close'].rolling(window=period).mean()

        # 构建返回数据
        chart_data = []
        for date, row in data.iterrows():
            item = {
                'date': date.strftime('%Y-%m-%d'),
                'price': round(row['Close'], 2),
                'volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
            }

            # 添加各周期均线
            for ma_name, ma_series in ma_data.items():
                ma_value = ma_series.get(date)
                item[ma_name.lower()] = round(ma_value, 2) if pd.notna(ma_value) else None

            chart_data.append(item)

        return {
            'symbol': symbol,
            'ma_periods': periods,
            'data_count': len(chart_data),
            'data': chart_data[-100:]  # 返回最近100条
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取均线详情失败: {str(e)}")
