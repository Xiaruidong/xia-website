// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// 交易品种配置
export const TRADING_SYMBOLS = [
  { id: 'gold', name: '黄金现货', symbol: 'GC=F', type: 'future' },
  { id: 'gold_etf', name: '黄金ETF (GLD)', symbol: 'GLD', type: 'etf' },
  { id: 'silver', name: '白银期货', symbol: 'SI=F', type: 'future' },
  { id: 'oil', name: '原油期货', symbol: 'CL=F', type: 'future' }
]

// 获取价格数据
export async function fetchPriceData(symbol) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price/${symbol}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('获取价格数据失败:', error)
    throw error
  }
}

// 获取均线数据
export async function fetchMAData(symbol, short = 5, medium = 20, long = 60) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/ma/${symbol}?short=${short}&medium=${medium}&long=${long}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('获取均线数据失败:', error)
    throw error
  }
}
