<template>
  <div class="gold-price-page">
    <div class="page-header">
      <h1 class="page-title">交易品种监控</h1>
      <p class="page-subtitle">实时价格监控与均线策略分析</p>
      <div class="header-divider"></div>
    </div>

    <div class="price-container">
      <!-- 品种选择器 -->
      <section class="selector-section">
        <h2 class="section-title">选择品种</h2>
        <div class="品种-tabs">
          <button
            v-for="品种 in availableSymbols"
            :key="品种.id"
            @click="switchSymbol(品种)"
            :class="['品种-tab', { active: currentSymbol.id === 品种.id }]"
          >
            {{ 品种.name }}
          </button>
        </div>
      </section>

      <!-- 价格信息 -->
      <section class="price-section">
        <h2 class="section-title">{{ currentSymbol.name }} 实时价格</h2>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>正在加载价格数据...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p>{{ error }}</p>
          <button @click="fetchPrice" class="retry-btn">重试</button>
        </div>

        <div v-else class="price-content">
          <!-- 当前价格 -->
          <div class="price-main">
            <div class="price-label">当前价格</div>
            <div class="price-value" :class="{ 'price-up': priceChange >= 0, 'price-down': priceChange < 0 }">
              {{ currentPrice }}
            </div>
            <div class="price-change" :class="{ 'change-up': priceChange >= 0, 'change-down': priceChange < 0 }">
              <span v-if="priceChange >= 0">+</span>{{ priceChangePercent }}%
            </div>
          </div>

          <!-- 价格统计 -->
          <div class="price-stats">
            <div class="stat-item">
              <span class="stat-label">今日开盘</span>
              <span class="stat-value">{{ priceStats.open }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">今日最高</span>
              <span class="stat-value">{{ priceStats.high }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">今日最低</span>
              <span class="stat-value">{{ priceStats.low }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">昨日收盘</span>
              <span class="stat-value">{{ priceStats.prevClose }}</span>
            </div>
          </div>

          <!-- 更新时间 -->
          <div class="update-time">
            最后更新: {{ updateTime }}
          </div>
        </div>
      </section>

      <!-- 价格走势图 -->
      <section class="chart-section">
        <h2 class="section-title">K线走势</h2>

        <div class="chart-controls">
          <div class="control-group">
            <label>时间周期:</label>
            <select v-model="chartPeriod" @change="fetchChartData">
              <option value="1d">1天</option>
              <option value="5d">5天</option>
              <option value="1mo" selected>1个月</option>
              <option value="3mo">3个月</option>
              <option value="6mo">6个月</option>
              <option value="1y">1年</option>
            </select>
          </div>
          <div class="control-group">
            <label>K线周期:</label>
            <select v-model="chartInterval" @change="fetchChartData">
              <option value="5m">5分钟</option>
              <option value="15m">15分钟</option>
              <option value="1h">1小时</option>
              <option value="1d" selected>1天</option>
              <option value="1wk">1周</option>
            </select>
          </div>
        </div>

        <div v-if="chartData.loading" class="loading-state">
          <p>正在加载K线数据...</p>
        </div>

        <div v-else class="chart-container">
          <div ref="priceChart" class="kline-chart"></div>
        </div>
      </section>

      <!-- 均线分析 -->
      <section class="ma-section">
        <h2 class="section-title">均线分析</h2>

        <div class="ma-controls">
          <div class="control-group">
            <label>短期均线:</label>
            <select v-model="maShort">
              <option value="10" selected>MA10</option>
              <option value="20">MA20</option>
            </select>
          </div>
          <div class="control-group">
            <label>中期均线:</label>
            <select v-model="maMedium">
              <option value="20">MA20</option>
              <option value="60" selected>MA60</option>
            </select>
          </div>
          <div class="control-group">
            <label>长期均线:</label>
            <select v-model="maLong">
              <option value="120" selected>MA120</option>
              <option value="200">MA200</option>
            </select>
          </div>
        </div>

        <div v-if="maData.loading" class="loading-state">
          <p>正在计算均线...</p>
        </div>

        <div v-else class="ma-content">
          <div class="ma-item">
            <span class="ma-label">MA{{ maShort }}:</span>
            <span class="ma-value">{{ maData.short }}</span>
          </div>
          <div class="ma-item">
            <span class="ma-label">MA{{ maMedium }}:</span>
            <span class="ma-value">{{ maData.medium }}</span>
          </div>
          <div class="ma-item">
            <span class="ma-label">MA{{ maLong }}:</span>
            <span class="ma-value">{{ maData.long }}</span>
          </div>

          <div class="ma-signal" :class="maData.signal">
            <strong>交易信号:</strong> {{ maData.signalText }}
          </div>
        </div>
      </section>

      <!-- 使用说明 -->
      <section class="info-section">
        <h2 class="section-title">数据说明</h2>
        <div class="info-content">
          <p>• 数据来源: Yahoo Finance</p>
          <p>• 更新频率: 每15秒</p>
          <p>• 数据延迟: 约15-20分钟</p>
          <p>• 仅供模拟交易参考，不构成投资建议</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { fetchPriceData, fetchMAData, TRADING_SYMBOLS, API_BASE_URL } from '../utils/config'

// 可用的交易品种
const availableSymbols = ref(TRADING_SYMBOLS)

// 当前选择的品种
const currentSymbol = ref(availableSymbols.value[0])

// 价格数据
const currentPrice = ref('--')
const priceChange = ref(0)
const priceChangePercent = ref('0.00')
const priceStats = ref({
  open: '--',
  high: '--',
  low: '--',
  prevClose: '--'
})

// 均线参数
const maShort = ref('10')
const maMedium = ref('60')
const maLong = ref('120')

// 均线数据
const maData = ref({
  loading: false,
  short: '--',
  medium: '--',
  long: '--',
  signal: 'neutral',
  signalText: '等待数据...'
})

// 图表相关
const priceChart = ref(null)
const chartPeriod = ref('1mo')
const chartInterval = ref('1d')
const chartData = ref({
  loading: false,
  ohlc: [] // OHLC数据: [{time, open, high, low, close}]
})
let chartInstance = null
let candlestickSeries = null

// 状态管理
const loading = ref(true)
const error = ref('')
const updateTime = ref('--')

let updateInterval = null

// 切换品种
const switchSymbol = (symbol) => {
  currentSymbol.value = symbol
  fetchPrice()
  fetchChartData()
}

// 获取价格数据
const fetchPrice = async () => {
  loading.value = true
  error.value = ''

  try {
    // 获取价格数据
    const priceData = await fetchPriceData(currentSymbol.value.id)

    // 更新价格信息
    currentPrice.value = priceData.current_price
    priceChange.value = priceData.change
    priceChangePercent.value = priceData.change_percent.toFixed(2)
    priceStats.value = {
      open: priceData.open,
      high: priceData.high,
      low: priceData.low,
      prevClose: priceData.prev_close
    }

    // 获取均线数据
    try {
      const maResponse = await fetchMAData(
        currentSymbol.value.id,
        parseInt(maShort.value),
        parseInt(maMedium.value),
        parseInt(maLong.value)
      )

      maData.value = {
        loading: false,
        short: maResponse.ma_short,
        medium: maResponse.ma_medium,
        long: maResponse.ma_long,
        signal: maResponse.signal,
        signalText: maResponse.signal_text
      }
    } catch (maError) {
      console.error('获取均线数据失败:', maError)
      maData.value = {
        loading: false,
        short: '--',
        medium: '--',
        long: '--',
        signal: 'neutral',
        signalText: '均线数据获取失败'
      }
    }

    updateTime.value = new Date().toLocaleTimeString('zh-CN')
    loading.value = false
  } catch (err) {
    console.error('获取数据失败:', err)
    error.value = '获取数据失败，请检查后端服务是否启动'
    loading.value = false
  }
}

// 获取图表数据
const fetchChartData = async () => {
  console.log('开始获取K线数据...')
  chartData.value.loading = true
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/price/${currentSymbol.value.id}/history?period=${chartPeriod.value}&interval=${chartInterval.value}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()

    console.log('API返回数据:', result)

    // 转换为lightweight-charts需要的格式
    const ohlcData = result.data.map(item => {
      const date = new Date(item.date)
      return {
        time: date.getTime() / 1000, // 转换为Unix时间戳（秒）
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close)
      }
    }).sort((a, b) => a.time - b.time) // 按时间排序

    console.log('转换后的OHLC数据:', ohlcData)

    chartData.value.ohlc = ohlcData
    chartData.value.loading = false

    console.log('准备渲染图表...')

    // 渲染K线图
    nextTick(() => {
      renderChart()
    })
  } catch (err) {
    console.error('获取K线数据失败:', err)
    chartData.value.loading = false
  }
}

// 渲染图表
const renderChart = async () => {
  if (!priceChart.value || chartData.value.ohlc.length === 0) return

  try {
    // 动态导入lightweight-charts
    const { createChart: createKLineChart } = await import('lightweight-charts')

    // 销毁现有图表
    if (chartInstance) {
      chartInstance.remove()
    }

    // 创建图表容器
    const container = priceChart.value

    // 创建图表实例
    chartInstance = createKLineChart(container, {
      width: container.clientWidth,
      height: 400,
      layout: {
        background: { type: 'solid', color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
      crosshair: {
        mode: 1, // 十线模式
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3, // 虚线
          labelBackgroundColor: '#4c525e',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3, // 虚线
          labelBackgroundColor: '#4c525e',
        },
      },
    })

    // 添加K线系列
    const candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#26a69a', // 涨 - 青色
      downColor: '#ef5350', // 跌 - 红色
      borderDownColor: '#ef5350',
      borderUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      wickUpColor: '#26a69a',
    })

    // 设置数据
    candlestickSeries.setData(chartData.value.ohlc)

    // 自动调整视图
    chartInstance.timeScale().fitContent()

    // 响应式调整
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== container) {
        return
      }
      const newRect = entries[0].contentRect
      chartInstance.applyOptions({ width: newRect.width - 32 })
    })

    resizeObserver.observe(container)
  } catch (error) {
    console.error('渲染K线图失败:', error)
  }
}

// 监听均线参数变化
watch([maShort, maMedium, maLong], () => {
  if (!loading.value && currentPrice.value !== '--') {
    fetchMAData(
      currentSymbol.value.id,
      parseInt(maShort.value),
      parseInt(maMedium.value),
      parseInt(maLong.value)
    ).then(maResponse => {
      maData.value = {
        loading: false,
        short: maResponse.ma_short,
        medium: maResponse.ma_medium,
        long: maResponse.ma_long,
        signal: maResponse.signal,
        signalText: maResponse.signal_text
      }
    }).catch(err => {
      console.error('更新均线数据失败:', err)
    })
  }
})

// 组件挂载时开始更新
onMounted(() => {
  fetchPrice()
  fetchChartData()
  // 每15秒更新一次
  updateInterval = setInterval(fetchPrice, 15000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  if (chartInstance) {
    chartInstance.remove()
  }
})
</script>

<style scoped>
.gold-price-page {
  padding-top: 120px;
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-header {
  text-align: center;
  padding: 60px 0 40px;
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 200;
  color: var(--深霜蓝);
  margin-bottom: 15px;
  letter-spacing: 0.2rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--浅青灰);
  font-weight: 300;
  letter-spacing: 0.1rem;
}

.header-divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 30px auto;
}

.price-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section-title {
  font-size: 1.3rem;
  color: var(--深霜蓝);
  margin-bottom: 20px;
  font-weight: 400;
}

/* 品种选择器 */
.品种-tabs {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.品种-tab {
  padding: 12px 24px;
  background: var(--柔白);
  border: 1px solid var(--浅雾);
  border-radius: 10px;
  color: var(--浅青灰);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.品种-tab:hover {
  background: var(--浅雾);
  color: var(--深霜蓝);
}

.品种-tab.active {
  background: var(--霜蓝);
  color: var(--柔白);
  border-color: var(--霜蓝);
}

/* 价格区域 */
.price-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.2);
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--浅雾);
  border-top-color: var(--霜蓝);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 24px;
  background: var(--霜蓝);
  color: var(--柔白);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: var(--深霜蓝);
}

/* 价格主显示 */
.price-main {
  text-align: center;
  margin-bottom: 40px;
}

.price-label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.price-value {
  font-size: 3.5rem;
  font-weight: 300;
  color: var(--深霜蓝);
  margin-bottom: 10px;
}

.price-value.price-up {
  color: #4CAF50;
}

.price-value.price-down {
  color: #F44336;
}

.price-change {
  font-size: 1.2rem;
  font-weight: 400;
}

.change-up {
  color: #4CAF50;
}

.change-down {
  color: #F44336;
}

/* 价格统计 */
.price-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: var(--浅雾);
  border-radius: 10px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--浅青灰);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--深霜蓝);
}

.update-time {
  text-align: center;
  font-size: 0.85rem;
  color: var(--浅青灰);
  margin-top: 20px;
}

/* 价格走势图 */
.chart-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.2);
}

.chart-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.chart-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
}

.kline-chart {
  width: 100%;
  height: 400px;
  border: 1px solid var(--浅雾);
  border-radius: 8px;
  overflow: hidden;
}

/* 均线分析 */
.ma-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.2);
}

.ma-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
}

.control-group select {
  padding: 8px 16px;
  border: 1px solid var(--浅雾);
  border-radius: 8px;
  background: white;
  color: var(--深霜蓝);
  font-size: 0.9rem;
  cursor: pointer;
}

.ma-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ma-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: var(--浅雾);
  border-radius: 10px;
}

.ma-label {
  font-weight: 500;
  color: var(--浅青灰);
}

.ma-value {
  font-weight: 600;
  color: var(--深霜蓝);
}

.ma-signal {
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  font-size: 1.1rem;
  margin-top: 10px;
}

.ma-signal.bullish {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  border: 1px solid #4CAF50;
}

.ma-signal.bearish {
  background: rgba(244, 67, 54, 0.1);
  color: #F44336;
  border: 1px solid #F44336;
}

.ma-signal.neutral {
  background: var(--浅雾);
  color: var(--浅青灰);
  border: 1px solid var(--浅雾);
}

/* 使用说明 */
.info-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px 40px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.2);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-content p {
  font-size: 0.9rem;
  color: var(--浅青灰);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .price-value {
    font-size: 2.5rem;
  }

  .ma-controls {
    flex-direction: column;
  }

  .price-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
