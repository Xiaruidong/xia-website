from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

router = APIRouter()

# 商品代码映射
SYMBOL_MAP = {
    'gold': 'GC=F',        # 黄金期货
    'gold_etf': 'GLD',     # 黄金ETF
    'silver': 'SI=F',      # 白银期货
    'oil': 'CL=F',         # 原油期货
    'copper': 'HG=F',      # 铜期货
    'platinum': 'PL=F',    # 铂金期货
    'palladium': 'PA=F',   # 钯金期货
    'natural_gas': 'NG=F', # 天然气期货
}

class PriceResponse(BaseModel):
    symbol: str
    name: str
    current_price: float
    change: float
    change_percent: float
    open: float
    high: float
    low: float
    prev_close: float
    volume: Optional[int]
    update_time: str

@router.get("/price/{symbol}", response_model=PriceResponse)
async def get_price(symbol: str):
    """
    获取商品实时价格数据

    参数:
    - symbol: 商品代码 (gold, gold_etf, silver, oil, copper等)
    """
    try:
        # 映射商品代码
        ticker_symbol = SYMBOL_MAP.get(symbol.lower(), symbol.upper())

        # 获取数据
        ticker = yf.Ticker(ticker_symbol)

        # 获取今日数据
        today = datetime.now().strftime('%Y-%m-%d')
        data = ticker.history(period='1d')

        if data.empty:
            # 尝试获取最近的数据
            data = ticker.history(period='2d')
            if data.empty:
                raise HTTPException(status_code=404, detail="无法获取价格数据")

        # 获取最新一行数据
        latest = data.iloc[-1]

        # 计算涨跌
        current_price = latest['Close']
        prev_close = latest.get('Open', latest['Close'])  # 如果没有Open，使用Close
        change = current_price - prev_close
        change_percent = (change / prev_close) * 100 if prev_close != 0 else 0

        # 获取商品名称
        name_map = {
            'GC=F': '黄金期货',
            'GLD': '黄金ETF',
            'SI=F': '白银期货',
            'CL=F': '原油期货',
            'HG=F': '铜期货',
            'PL=F': '铂金期货',
            'PA=F': '钯金期货',
            'NG=F': '天然气期货'
        }

        return PriceResponse(
            symbol=symbol,
            name=name_map.get(ticker_symbol, f"{symbol} 期货"),
            current_price=round(current_price, 2),
            change=round(change, 2),
            change_percent=round(change_percent, 2),
            open=round(latest['Open'], 2),
            high=round(latest['High'], 2),
            low=round(latest['Low'], 2),
            prev_close=round(prev_close, 2),
            volume=int(latest['Volume']) if pd.notna(latest['Volume']) else None,
            update_time=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取价格失败: {str(e)}")

@router.get("/price/{symbol}/history")
async def get_price_history(
    symbol: str,
    period: str = "1mo",
    interval: str = "1d"
):
    """
    获取历史价格数据（用于计算均线）

    参数:
    - symbol: 商品代码
    - period: 时间周期 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)
    - interval: 数据间隔 (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
    """
    try:
        ticker_symbol = SYMBOL_MAP.get(symbol.lower(), symbol.upper())
        ticker = yf.Ticker(ticker_symbol)

        # 获取历史数据
        data = ticker.history(period=period, interval=interval)

        if data.empty:
            raise HTTPException(status_code=404, detail="无法获取历史数据")

        # 转换为字典列表
        history = []
        for date, row in data.iterrows():
            history.append({
                'date': date.strftime('%Y-%m-%d %H:%M:%S'),
                'open': round(row['Open'], 2),
                'high': round(row['High'], 2),
                'low': round(row['Low'], 2),
                'close': round(row['Close'], 2),
                'volume': int(row['Volume']) if pd.notna(row['Volume']) else 0
            })

        return {
            'symbol': symbol,
            'period': period,
            'interval': interval,
            'data_count': len(history),
            'data': history[-100:]  # 只返回最近100条数据
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史数据失败: {str(e)}")
