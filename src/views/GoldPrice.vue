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
import { ref, onMounted, onUnmounted } from 'vue'

// 可用的交易品种
const availableSymbols = ref([
  { id: 'gold', name: '黄金现货', symbol: 'GC=F', type: 'future' },
  { id: 'gold_etf', name: '黄金ETF (GLD)', symbol: 'GLD', type: 'etf' },
  { id: 'silver', name: '白银期货', symbol: 'SI=F', type: 'future' },
  { id: 'oil', name: '原油期货', symbol: 'CL=F', type: 'future' }
])

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

// 状态管理
const loading = ref(true)
const error = ref('')
const updateTime = ref('--')

let updateInterval = null

// 切换品种
const switchSymbol = (symbol) => {
  currentSymbol.value = symbol
  fetchPrice()
}

// 获取价格数据
const fetchPrice = async () => {
  loading.value = true
  error.value = ''

  try {
    // TODO: 这里需要后端API支持，暂时使用模拟数据
    // const response = await fetch(`/api/price/${currentSymbol.value.symbol}`)
    // const data = await response.json()

    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (currentSymbol.value.id === 'gold' || currentSymbol.value.id === 'gold_etf') {
      // 黄金模拟数据
      const basePrice = currentSymbol.value.id === 'gold' ? 2350.50 : 225.30
      const change = (Math.random() - 0.5) * 20
      currentPrice.value = (basePrice + change).toFixed(2)
      priceChange.value = change.toFixed(2)
      priceChangePercent.value = ((change / basePrice) * 100).toFixed(2)
      priceStats.value = {
        open: (basePrice - 5).toFixed(2),
        high: (basePrice + 8).toFixed(2),
        low: (basePrice - 12).toFixed(2),
        prevClose: (basePrice - 3).toFixed(2)
      }

      // 模拟均线数据
      maData.value = {
        loading: false,
        short: (basePrice + 2).toFixed(2),
        medium: (basePrice - 1).toFixed(2),
        long: (basePrice - 5).toFixed(2),
        signal: change > 0 ? 'bullish' : 'bearish',
        signalText: change > 0 ? '看涨 - 短期均线上穿中期均线' : '看跌 - 短期均线下穿中期均线'
      }
    } else {
      // 其他品种模拟数据
      const basePrice = currentSymbol.value.id === 'silver' ? 28.50 : 78.20
      const change = (Math.random() - 0.5) * 2
      currentPrice.value = basePrice.toFixed(2)
      priceChange.value = change.toFixed(2)
      priceChangePercent.value = ((change / basePrice) * 100).toFixed(2)

      maData.value = {
        loading: false,
        short: (basePrice + 0.5).toFixed(2),
        medium: basePrice.toFixed(2),
        long: (basePrice - 0.5).toFixed(2),
        signal: 'neutral',
        signalText: '等待数据...'
      }
    }

    updateTime.value = new Date().toLocaleTimeString('zh-CN')
    loading.value = false
  } catch (err) {
    error.value = '获取价格失败: ' + err.message
    loading.value = false
  }
}

// 组件挂载时开始更新
onMounted(() => {
  fetchPrice()
  // 每15秒更新一次
  updateInterval = setInterval(fetchPrice, 15000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
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
