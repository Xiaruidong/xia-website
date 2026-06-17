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
        <h2 class="section-title">价格走势</h2>

        <div class="chart-controls">
          <div class="control-group">
            <label>时间范围:</label>
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
            <label>数据间隔:</label>
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
          <p>正在加载图表数据...</p>
        </div>

        <div v-else class="chart-container">
          <canvas ref="priceChart" width="800" height="400"></canvas>
        </div>
      </section>

      <!-- 均线分析 -->
      <section class="ma-section">
        <h2 class="section-title">均线分析</h2>

        <div class="ma-controls">
          <div class="control-group">
            <label>短期均线:</label>
            <select v-model="maShort">
              <option value="5">MA5</option>
              <option value="10">MA10</option>
              <option value="20">MA20</option>
            </select>
          </div>
          <div class="control-group">
            <label>中期均线:</label>
            <select v-model="maMedium">
              <option value="20">MA20</option>
              <option value="30">MA30</option>
              <option value="60">MA60</option>
            </select>
          </div>
          <div class="control-group">
            <label>长期均线:</label>
            <select v-model="maLong">
              <option value="60">MA60</option>
              <option value="120">MA120</option>
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
import { Chart, registerables } from 'chart.js'

// 注册Chart.js组件
Chart.register(...registerables)

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
const maShort = ref('5')
const maMedium = ref('20')
const maLong = ref('60')

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
  labels: [],
  prices: []
})
let chartInstance = null

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
  chartData.value.loading = true
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/price/${currentSymbol.value.id}/history?period=${chartPeriod.value}&interval=${chartInterval.value}`
    )
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()

    // 更新图表数据
    chartData.value.labels = data.data.map(item => item.date)
    chartData.value.prices = data.data.map(item => item.close)
    chartData.value.loading = false

    // 渲染图表
    nextTick(() => {
      renderChart()
    })
  } catch (err) {
    console.error('获取图表数据失败:', err)
    chartData.value.loading = false
  }
}

// 渲染图表
const renderChart = () => {
  if (!priceChart.value) return

  // 销毁现有图表
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = priceChart.value.getContext('2d')

  // 根据价格变化确定颜色
  const firstPrice = chartData.value.prices[0] || 0
  const lastPrice = chartData.value.prices[chartData.value.prices.length - 1] || 0
  const isUp = lastPrice >= firstPrice
  const lineColor = isUp ? '#4CAF50' : '#F44336'

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.value.labels,
      datasets: [{
        label: `${currentSymbol.value.name} 价格`,
        data: chartData.value.prices,
        borderColor: lineColor,
        backgroundColor: isUp ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#666',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `价格: ${context.parsed.y.toFixed(2)}`
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: '时间',
            color: '#666',
            font: {
              size: 12
            }
          },
          ticks: {
            color: '#666',
            maxTicksLimit: 10
          },
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: '价格',
            color: '#666',
            font: {
              size: 12
            }
          },
          ticks: {
            color: '#666',
            callback: function(value) {
              return value.toFixed(2)
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  })
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
    chartInstance.destroy()
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
  max-width: 800px;
  margin: 0 auto;
}

.chart-container canvas {
  width: 100% !important;
  height: auto !important;
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
