// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 是否使用模拟数据（当API不可用时）
export const USE_MOCK_DATA = true

// 交易品种配置
export const TRADING_SYMBOLS = [
  { id: 'gold', name: '黄金现货', symbol: 'GC=F', type: 'future' },
  { id: 'gold_etf', name: '黄金ETF (GLD)', symbol: 'GLD', type: 'etf' },
  { id: 'silver', name: '白银期货', symbol: 'SI=F', type: 'future' },
  { id: 'oil', name: '原油期货', symbol: 'CL=F', type: 'future' }
]

// 模拟价格数据
const MOCK_PRICE_DATA = {
  gold: {
    current_price: 2350.50,
    change: 15.30,
    open: 2335.20,
    high: 2365.80,
    low: 2330.10,
    prev_close: 2335.20
  },
  gold_etf: {
    current_price: 225.30,
    change: 1.20,
    open: 224.10,
    high: 226.50,
    low: 223.80,
    prev_close: 224.10
  },
  silver: {
    current_price: 28.50,
    change: 0.35,
    open: 28.15,
    high: 28.75,
    low: 28.05,
    prev_close: 28.15
  },
  oil: {
    current_price: 78.20,
    change: -1.50,
    open: 79.70,
    high: 80.10,
    low: 77.90,
    prev_close: 79.70
  }
}

// 获取价格数据
export async function fetchPriceData(symbol) {
  // 如果使用模拟数据
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
    const mockData = MOCK_PRICE_DATA[symbol] || MOCK_PRICE_DATA.gold
    return {
      symbol: symbol,
      name: TRADING_SYMBOLS.find(s => s.id === symbol)?.name || symbol,
      current_price: mockData.current_price,
      change: mockData.change,
      change_percent: parseFloat(((mockData.change / mockData.prev_close) * 100).toFixed(2)),
      open: mockData.open,
      high: mockData.high,
      low: mockData.low,
      prev_close: mockData.prev_close,
      volume: 1000000,
      update_time: new Date().toLocaleString('zh-CN')
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/price/${symbol}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('获取价格数据失败，使用模拟数据:', error)
    // 失败时回退到模拟数据
    const mockData = MOCK_PRICE_DATA[symbol] || MOCK_PRICE_DATA.gold
    return {
      symbol: symbol,
      name: TRADING_SYMBOLS.find(s => s.id === symbol)?.name || symbol,
      current_price: mockData.current_price,
      change: mockData.change,
      change_percent: parseFloat(((mockData.change / mockData.prev_close) * 100).toFixed(2)),
      open: mockData.open,
      high: mockData.high,
      low: mockData.low,
      prev_close: mockData.prev_close,
      volume: 1000000,
      update_time: new Date().toLocaleString('zh-CN')
    }
  }
}

// 获取均线数据
export async function fetchMAData(symbol, short = 5, medium = 20, long = 60) {
  // 如果使用模拟数据
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const mockData = MOCK_PRICE_DATA[symbol] || MOCK_PRICE_DATA.gold
    return {
      symbol: symbol,
      current_price: mockData.current_price,
      ma_short: (mockData.current_price + 2).toFixed(2),
      ma_medium: mockData.current_price.toFixed(2),
      ma_long: (mockData.current_price - 3).toFixed(2),
      signal: mockData.change > 0 ? 'bullish' : 'bearish',
      signal_text: mockData.change > 0 ? '看涨 - 短期均线上穿中期均线' : '看跌 - 短期均线下穿中期均线',
      update_time: new Date().toLocaleString('zh-CN')
    }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ma/${symbol}?short=${short}&medium=${medium}&long=${long}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('获取均线数据失败，使用模拟数据:', error)
    // 失败时回退到模拟数据
    const mockData = MOCK_PRICE_DATA[symbol] || MOCK_PRICE_DATA.gold
    return {
      symbol: symbol,
      current_price: mockData.current_price,
      ma_short: (mockData.current_price + 2).toFixed(2),
      ma_medium: mockData.current_price.toFixed(2),
      ma_long: (mockData.current_price - 3).toFixed(2),
      signal: mockData.change > 0 ? 'bullish' : 'bearish',
      signal_text: mockData.change > 0 ? '看涨 - 短期均线上穿中期均线' : '看跌 - 短期均线下穿中期均线',
      update_time: new Date().toLocaleString('zh-CN')
    }
  }
}
