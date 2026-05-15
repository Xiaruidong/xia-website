<template>
  <div class="crawler-page">
    <div class="page-header">
      <h1 class="page-title">招聘投递链接爬虫工具</h1>
      <p class="page-subtitle">自动化爬取国央企、大厂招聘信息并整理投递链接</p>
      <div class="header-divider"></div>
    </div>

    <div class="crawler-container">
      <!-- 配置面板 -->
      <section class="config-panel">
        <h2 class="panel-title">爬虫配置</h2>

        <!-- 渠道配置 -->
        <div class="config-section">
          <h3 class="section-title">爬取渠道</h3>
          <div class="channel-groups">
            <div class="channel-group">
              <h4>国央企官方渠道</h4>
              <div class="channel-list">
                <label v-for="channel in stateOwnedChannels" :key="channel.id" class="channel-item">
                  <input
                    type="checkbox"
                    v-model="channel.selected"
                    :disabled="isRunning"
                  />
                  <span class="channel-name">{{ channel.name }}</span>
                  <span class="channel-url">{{ channel.url }}</span>
                </label>
              </div>
            </div>

            <div class="channel-group">
              <h4>大厂官方渠道</h4>
              <div class="channel-list">
                <label v-for="channel in techCompanyChannels" :key="channel.id" class="channel-item">
                  <input
                    type="checkbox"
                    v-model="channel.selected"
                    :disabled="isRunning"
                  />
                  <span class="channel-name">{{ channel.name }}</span>
                  <span class="channel-url">{{ channel.url }}</span>
                </label>
              </div>
            </div>

            <div class="channel-group">
              <h4>第三方招聘平台</h4>
              <div class="channel-list">
                <label v-for="channel in platformChannels" :key="channel.id" class="channel-item">
                  <input
                    type="checkbox"
                    v-model="channel.selected"
                    :disabled="isRunning"
                  />
                  <span class="channel-name">{{ channel.name }}</span>
                  <span class="channel-url">{{ channel.url }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="channel-actions">
            <button @click="selectAllChannels" class="action-btn" :disabled="isRunning">全选</button>
            <button @click="deselectAllChannels" class="action-btn" :disabled="isRunning">取消全选</button>
          </div>
        </div>

        <!-- 爬取规则配置 -->
        <div class="config-section">
          <h3 class="section-title">爬取规则</h3>
          <div class="rule-config">
            <div class="rule-item">
              <label>爬取频率</label>
              <select v-model="config.frequency" :disabled="isRunning">
                <option value="manual">手动执行</option>
                <option value="daily">每日一次</option>
                <option value="weekly">每周一次</option>
                <option value="hourly">每小时</option>
              </select>
            </div>

            <div class="rule-item">
              <label>重试次数</label>
              <input
                type="number"
                v-model.number="config.retryCount"
                min="0"
                max="10"
                :disabled="isRunning"
              />
            </div>

            <div class="rule-item">
              <label>请求间隔（秒）</label>
              <input
                type="number"
                v-model.number="config.requestInterval"
                min="1"
                max="60"
                :disabled="isRunning"
              />
            </div>

            <div class="rule-item">
              <label>超时时间（秒）</label>
              <input
                type="number"
                v-model.number="config.timeout"
                min="5"
                max="120"
                :disabled="isRunning"
              />
            </div>
          </div>
        </div>

        <!-- 关键词配置 -->
        <div class="config-section">
          <h3 class="section-title">关键词配置</h3>
          <div class="keyword-config">
            <div class="keyword-group">
              <label>投递关键词</label>
              <div class="tag-list">
                <span
                  v-for="(keyword, index) in config.applyKeywords"
                  :key="index"
                  class="tag"
                >
                  {{ keyword }}
                  <button @click="removeApplyKeyword(index)" class="tag-remove">×</button>
                </span>
                <input
                  v-model="newApplyKeyword"
                  @keyup.enter="addApplyKeyword"
                  placeholder="添加关键词"
                  class="tag-input"
                  :disabled="isRunning"
                />
              </div>
            </div>

            <div class="keyword-group">
              <label>黑名单关键词</label>
              <div class="tag-list">
                <span
                  v-for="(keyword, index) in config.blacklistKeywords"
                  :key="index"
                  class="tag tag-danger"
                >
                  {{ keyword }}
                  <button @click="removeBlacklistKeyword(index)" class="tag-remove">×</button>
                </span>
                <input
                  v-model="newBlacklistKeyword"
                  @keyup.enter="addBlacklistKeyword"
                  placeholder="添加黑名单关键词"
                  class="tag-input"
                  :disabled="isRunning"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="control-section">
          <button
            @click="startCrawler"
            class="control-btn control-btn-start"
            :disabled="isRunning || !hasSelectedChannels"
          >
            <span v-if="!isRunning">▶ 启动爬虫</span>
            <span v-else">⏸ 运行中...</span>
          </button>
          <button
            @click="stopCrawler"
            class="control-btn control-btn-stop"
            :disabled="!isRunning"
          >
            ⏹ 停止
          </button>
          <button
            @click="testCrawler"
            class="control-btn control-btn-test"
            :disabled="isRunning"
          >
            🧪 测试配置
          </button>
        </div>
      </section>

      <!-- 状态面板 -->
      <section class="status-panel">
        <h2 class="panel-title">运行状态</h2>
        <div class="status-grid">
          <div class="status-card">
            <div class="status-label">状态</div>
            <div class="status-value" :class="`status-${status.state}`">
              {{ statusText }}
            </div>
          </div>
          <div class="status-card">
            <div class="status-label">已爬取</div>
            <div class="status-value">{{ status.crawledCount }}</div>
          </div>
          <div class="status-card">
            <div class="status-label">提取链接</div>
            <div class="status-value">{{ status.linkCount }}</div>
          </div>
          <div class="status-card">
            <div class="status-label">有效链接</div>
            <div class="status-value status-success">{{ status.validLinkCount }}</div>
          </div>
          <div class="status-card">
            <div class="status-label">无效链接</div>
            <div class="status-value status-error">{{ status.invalidLinkCount }}</div>
          </div>
          <div class="status-card">
            <div class="status-label">进度</div>
            <div class="status-value">{{ status.progress }}%</div>
          </div>
        </div>

        <div v-if="isRunning" class="progress-bar">
          <div class="progress-fill" :style="{ width: status.progress + '%' }"></div>
        </div>
      </section>

      <!-- 结果表格 -->
      <section class="results-panel">
        <div class="panel-header">
          <h2 class="panel-title">爬取结果</h2>
          <div class="panel-actions">
            <button @click="exportToExcel" class="export-btn" :disabled="results.length === 0">
              📊 导出 Excel
            </button>
            <button @click="clearResults" class="clear-btn" :disabled="isRunning || results.length === 0">
              🗑️ 清空结果
            </button>
          </div>
        </div>

        <div class="table-filters">
          <input
            v-model="filters.keyword"
            placeholder="搜索企业或岗位..."
            class="search-input"
          />
          <select v-model="filters.companyType" class="filter-select">
            <option value="">全部类型</option>
            <option value="国央企">国央企</option>
            <option value="大厂">大厂</option>
            <option value="第三方">第三方平台</option>
          </select>
          <select v-model="filters.linkStatus" class="filter-select">
            <option value="">全部状态</option>
            <option value="有效">有效</option>
            <option value="无效">无效</option>
          </select>
        </div>

        <div class="table-wrapper">
          <table class="results-table">
            <thead>
              <tr>
                <th @click="sortBy('index')" class="sortable">
                  序号
                  <span v-if="sortField === 'index'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('companyName')" class="sortable">
                  企业名称
                  <span v-if="sortField === 'companyName'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('companyType')" class="sortable">
                  企业类型
                  <span v-if="sortField === 'companyType'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('industry')" class="sortable">
                  所属行业
                  <span v-if="sortField === 'industry'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('position')" class="sortable">
                  招聘岗位
                  <span v-if="sortField === 'position'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('location')" class="sortable">
                  工作地点
                  <span v-if="sortField === 'location'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th>投递链接</th>
                <th @click="sortBy('source')" class="sortable">
                  来源
                  <span v-if="sortField === 'source'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('crawlTime')" class="sortable">
                  爬取时间
                  <span v-if="sortField === 'crawlTime'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th @click="sortBy('linkStatus')" class="sortable">
                  链接状态
                  <span v-if="sortField === 'linkStatus'" class="sort-icon">{{ sortAsc ? '↑' : '↓' }}</span>
                </th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in paginatedResults" :key="item.id || index">
                <td>{{ index + 1 + (currentPage - 1) * pageSize }}</td>
                <td>{{ item.companyName }}</td>
                <td>
                  <span class="badge" :class="`badge-${item.companyType}`">
                    {{ item.companyType }}
                  </span>
                </td>
                <td>{{ item.industry }}</td>
                <td>{{ item.position }}</td>
                <td>{{ item.location }}</td>
                <td>
                  <a :href="item.applyLink" target="_blank" class="link" :title="item.applyLink">
                    {{ item.applyLink.length > 30 ? item.applyLink.substring(0, 30) + '...' : item.applyLink }}
                  </a>
                </td>
                <td>{{ item.source }}</td>
                <td>{{ formatTime(item.crawlTime) }}</td>
                <td>
                  <span class="status-badge" :class="`status-${item.linkStatus}`">
                    {{ item.linkStatus }}
                  </span>
                </td>
                <td>{{ item.remark || '-' }}</td>
              </tr>
              <tr v-if="paginatedResults.length === 0">
                <td colspan="11" class="empty-row">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="page-btn"
          >
            上一页
          </button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage >= totalPages"
            class="page-btn"
          >
            下一页
          </button>
        </div>
      </section>

      <!-- 日志面板 -->
      <section class="log-panel">
        <div class="panel-header">
          <h2 class="panel-title">爬取日志</h2>
          <div class="panel-actions">
            <button @click="clearLogs" class="clear-btn" :disabled="logs.length === 0">
              清空日志
            </button>
            <button @click="exportLogs" class="export-btn">
              导出日志
            </button>
          </div>
        </div>
        <div class="log-content" ref="logContent">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
            :class="`log-${log.type}`"
          >
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-level">[{{ log.level }}]</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="log-empty">暂无日志</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 渠道数据
const stateOwnedChannels = ref([
  { id: 1, name: '国家电网', url: 'https://zhaopin.sgcc.com.cn/', selected: true },
  { id: 2, name: '中石油', url: 'https://hr.petroleumchina.com.cn/', selected: true },
  { id: 3, name: '中石化', url: 'https://job.sinopec.com/', selected: true },
  { id: 4, name: '中国建筑', url: 'https://recruit.cscec.com/', selected: false },
  { id: 5, name: '中国工商银行', url: 'https://job.icbc.com.cn/', selected: false },
  { id: 6, name: '中国建设银行', url: 'https://job.ccb.com/', selected: false },
  { id: 7, name: '中国移动', url: 'https://www.10086.cn/aboutus/recruit/', selected: false },
  { id: 8, name: '中国联通', url: 'https://www.chinaunicom.com.cn/hr/', selected: false },
  { id: 9, name: '国家能源集团', url: 'https://zhaopin.chnenergy.com.cn/', selected: false },
  { id: 10, name: '中国铁路', url: 'https://www.china-railway.com.cn/zp/', selected: false }
])

const techCompanyChannels = ref([
  { id: 101, name: '腾讯', url: 'https://careers.tencent.com/', selected: true },
  { id: 102, name: '阿里巴巴', url: 'https://jobs.alibaba.com/', selected: true },
  { id: 103, name: '字节跳动', url: 'https://jobs.bytedance.com/', selected: true },
  { id: 104, name: '华为', url: 'https://www.huawei.com/cn/careers/', selected: false },
  { id: 105, name: '百度', url: 'https://talent.baidu.com/', selected: false },
  { id: 106, name: '京东', url: 'https://zhaopin.jd.com/', selected: false },
  { id: 107, name: '美团', url: 'https://zhaopin.meituan.com/', selected: false },
  { id: 108, name: '网易', url: 'https://hr.163.com/', selected: false },
  { id: 109, name: '小米', url: 'https://hr.xiaomi.com/', selected: false },
  { id: 110, name: '滴滴', url: 'https://www.didiglobal.com/careers', selected: false }
])

const platformChannels = ref([
  { id: 201, name: '智联招聘', url: 'https://www.zhaopin.com/', selected: false },
  { id: 202, name: '前程无忧', url: 'https://www.51job.com/', selected: false },
  { id: 203, name: 'BOSS直聘', url: 'https://www.zhipin.com/', selected: false },
  { id: 204, name: '拉勾网', url: 'https://www.lagou.com/', selected: false }
])

// 配置
const config = ref({
  frequency: 'manual',
  retryCount: 3,
  requestInterval: 2,
  timeout: 30,
  applyKeywords: ['投递', '申请', 'apply', 'submit', '简历', 'resume', 'mailTo:', 'career'],
  blacklistKeywords: ['登录', '注册', 'login', 'register']
})

const newApplyKeyword = ref('')
const newBlacklistKeyword = ref('')

// 状态
const isRunning = ref(false)
const status = ref({
  state: 'idle', // idle, running, paused, error
  crawledCount: 0,
  linkCount: 0,
  validLinkCount: 0,
  invalidLinkCount: 0,
  progress: 0
})

// 结果
const results = ref([])
const logs = ref([])
const logContent = ref(null)

// 筛选和排序
const filters = ref({
  keyword: '',
  companyType: '',
  linkStatus: ''
})

const sortField = ref('crawlTime')
const sortAsc = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const hasSelectedChannels = computed(() => {
  return [
    ...stateOwnedChannels.value,
    ...techCompanyChannels.value,
    ...platformChannels.value
  ].some(ch => ch.selected)
})

const statusText = computed(() => {
  switch (status.value.state) {
    case 'idle': return '空闲'
    case 'running': return '运行中'
    case 'paused': return '已暂停'
    case 'error': return '错误'
    default: return '未知'
  }
})

const filteredResults = computed(() => {
  let filtered = [...results.value]

  // 关键词搜索
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    filtered = filtered.filter(item =>
      item.companyName?.toLowerCase().includes(keyword) ||
      item.position?.toLowerCase().includes(keyword)
    )
  }

  // 企业类型筛选
  if (filters.value.companyType) {
    filtered = filtered.filter(item => item.companyType === filters.value.companyType)
  }

  // 链接状态筛选
  if (filters.value.linkStatus) {
    filtered = filtered.filter(item => item.linkStatus === filters.value.linkStatus)
  }

  // 排序
  filtered.sort((a, b) => {
    const aVal = a[sortField.value] || ''
    const bVal = b[sortField.value] || ''
    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    return sortAsc.value ? comparison : -comparison
  })

  return filtered
})

const totalPages = computed(() => {
  return Math.ceil(filteredResults.value.length / pageSize.value) || 1
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredResults.value.slice(start, end)
})

// 方法
const selectAllChannels = () => {
  stateOwnedChannels.value.forEach(ch => ch.selected = true)
  techCompanyChannels.value.forEach(ch => ch.selected = true)
  platformChannels.value.forEach(ch => ch.selected = true)
}

const deselectAllChannels = () => {
  stateOwnedChannels.value.forEach(ch => ch.selected = false)
  techCompanyChannels.value.forEach(ch => ch.selected = false)
  platformChannels.value.forEach(ch => ch.selected = false)
}

const addApplyKeyword = () => {
  if (newApplyKeyword.value && !config.value.applyKeywords.includes(newApplyKeyword.value)) {
    config.value.applyKeywords.push(newApplyKeyword.value)
    newApplyKeyword.value = ''
  }
}

const removeApplyKeyword = (index) => {
  config.value.applyKeywords.splice(index, 1)
}

const addBlacklistKeyword = () => {
  if (newBlacklistKeyword.value && !config.value.blacklistKeywords.includes(newBlacklistKeyword.value)) {
    config.value.blacklistKeywords.push(newBlacklistKeyword.value)
    newBlacklistKeyword.value = ''
  }
}

const removeBlacklistKeyword = (index) => {
  config.value.blacklistKeywords.splice(index, 1)
}

const addLog = (level, message, type = 'info') => {
  logs.value.push({
    time: new Date(),
    level,
    message,
    type
  })

  nextTick(() => {
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight
    }
  })
}

const startCrawler = async () => {
  isRunning.value = true
  status.value.state = 'running'
  status.value.progress = 0

  addLog('INFO', '爬虫任务启动', 'success')

  const selectedChannels = [
    ...stateOwnedChannels.value.filter(ch => ch.selected),
    ...techCompanyChannels.value.filter(ch => ch.selected),
    ...platformChannels.value.filter(ch => ch.selected)
  ]

  addLog('INFO', `选中 ${selectedChannels.length} 个爬取渠道`, 'info')

  // 模拟爬取过程（实际需要后端支持）
  for (let i = 0; i < selectedChannels.length; i++) {
    const channel = selectedChannels[i]

    if (!isRunning.value) break

    addLog('INFO', `正在爬取: ${channel.name}`, 'info')

    // 模拟爬取延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模拟生成结果
    const mockResult = {
      id: Date.now() + i,
      companyName: channel.name,
      companyType: stateOwnedChannels.value.some(ch => ch.id === channel.id) ? '国央企' :
                   techCompanyChannels.value.some(ch => ch.id === channel.id) ? '大厂' : '第三方',
      industry: getIndustry(channel.name),
      position: '软件工程师',
      location: '北京',
      applyLink: channel.url + 'apply/' + Date.now(),
      source: channel.name,
      crawlTime: new Date(),
      linkStatus: '有效',
      remark: ''
    }

    results.value.unshift(mockResult)
    status.value.crawledCount++
    status.value.linkCount++
    status.value.validLinkCount++

    status.value.progress = Math.round(((i + 1) / selectedChannels.length) * 100)
  }

  if (isRunning.value) {
    addLog('INFO', `爬取完成！共获取 ${status.value.crawledCount} 条结果`, 'success')
    status.value.state = 'idle'
  } else {
    addLog('WARN', '爬虫任务已停止', 'warning')
    status.value.state = 'paused'
  }

  isRunning.value = false
}

const stopCrawler = () => {
  isRunning.value = false
  addLog('WARN', '用户停止爬虫任务', 'warning')
}

const testCrawler = () => {
  addLog('INFO', '测试配置...', 'info')
  addLog('INFO', `配置验证通过: ${hasSelectedChannels.value ? '已选择渠道' : '未选择渠道'}`, 'success')
  addLog('INFO', `重试次数: ${config.value.retryCount}`, 'info')
  addLog('INFO', `请求间隔: ${config.value.requestInterval}秒`, 'info')
}

const getIndustry = (companyName) => {
  const industries = {
    '国家电网': '电力/能源',
    '中石油': '石油化工',
    '中石化': '石油化工',
    '中国建筑': '建筑工程',
    '中国工商银行': '金融',
    '中国建设银行': '金融',
    '中国移动': '通信',
    '中国联通': '通信',
    '腾讯': '互联网',
    '阿里巴巴': '互联网',
    '字节跳动': '互联网',
    '华为': '科技',
    '百度': '互联网',
    '京东': '互联网',
    '美团': '互联网',
    '网易': '互联网',
    '小米': '科技',
    '滴滴': '互联网'
  }
  return industries[companyName] || '其他'
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportToExcel = () => {
  // 导出 Excel（这里需要使用库如 xlsx）
  addLog('INFO', '导出 Excel 功能开发中...', 'warning')
}

const clearResults = () => {
  if (confirm('确定要清空所有结果吗？')) {
    results.value = []
    status.value = {
      state: 'idle',
      crawledCount: 0,
      linkCount: 0,
      validLinkCount: 0,
      invalidLinkCount: 0,
      progress: 0
    }
    addLog('INFO', '结果已清空', 'info')
  }
}

const clearLogs = () => {
  logs.value = []
}

const exportLogs = () => {
  const logText = logs.value.map(log =>
    `[${formatTime(log.time)}] [${log.level}] ${log.message}`
  ).join('\n')

  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `crawler-log-${Date.now()}.txt`
  link.click()
  URL.revokeObjectURL(url)

  addLog('INFO', '日志已导出', 'success')
}

onMounted(() => {
  addLog('INFO', '爬虫工具已加载', 'info')
})

onUnmounted(() => {
  if (isRunning.value) {
    stopCrawler()
  }
})
</script>

<style scoped>
.crawler-page {
  padding-top: 120px;
  min-height: 100vh;
  padding-bottom: 60px;
}

.page-header {
  text-align: center;
  padding: 60px 0 40px;
}

.page-title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 200;
  letter-spacing: 0.4rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--深霜蓝);
  letter-spacing: 0.2rem;
  font-weight: 200;
}

.header-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 30px auto;
}

.crawler-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.panel-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  margin-bottom: 25px;
  font-weight: 400;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.panel-actions {
  display: flex;
  gap: 10px;
}

/* 配置面板 */
.config-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
  font-weight: 500;
}

.channel-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 15px;
}

.channel-group h4 {
  font-size: 0.95rem;
  color: var(--深霜蓝);
  margin-bottom: 10px;
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--浅雾);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.channel-item:hover {
  background: var(--霜蓝);
}

.channel-name {
  font-weight: 500;
  color: var(--浅青灰);
}

.channel-url {
  font-size: 0.8rem;
  color: var(--text-light);
  margin-left: auto;
}

.channel-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover:not(:disabled) {
  background: var(--text-dark);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 规则配置 */
.rule-config {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.rule-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item label {
  font-size: 0.9rem;
  color: var(--浅青灰);
}

.rule-item input,
.rule-item select {
  padding: 10px;
  border: 1px solid var(--霜蓝);
  border-radius: 8px;
  background: white;
}

/* 关键词配置 */
.keyword-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.keyword-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.keyword-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--浅雾);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--浅青灰);
}

.tag-danger {
  background: rgba(239, 83, 80, 0.1);
  color: #ef5350;
}

.tag-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: inherit;
}

.tag-remove:hover {
  background: rgba(0, 0, 0, 0.2);
}

.tag-input {
  padding: 8px 12px;
  border: 1px solid var(--霜蓝);
  border-radius: 20px;
  font-size: 0.85rem;
  min-width: 150px;
}

/* 控制按钮 */
.control-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid var(--霜蓝);
}

.control-btn {
  padding: 15px 40px;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn-start {
  background: var(--浅青灰);
  color: var(--米白);
}

.control-btn-start:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.control-btn-stop {
  background: rgba(239, 83, 80, 0.2);
  color: #ef5350;
}

.control-btn-stop:hover:not(:disabled) {
  background: rgba(239, 83, 80, 0.3);
}

.control-btn-test {
  background: var(--霜蓝);
  color: var(--米白);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 状态面板 */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.status-card {
  background: var(--浅雾);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.status-label {
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 8px;
}

.status-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--浅青灰);
}

.status-value.status-success {
  color: #4CAF50;
}

.status-value.status-error {
  color: #ef5350;
}

.status-idle {
  color: var(--浅青灰);
}

.status-running {
  color: #4CAF50;
}

.status-error {
  color: #ef5350;
}

.progress-bar {
  height: 8px;
  background: var(--浅雾);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--霜蓝), var(--深霜蓝));
  transition: width 0.3s ease;
}

/* 结果表格 */
.table-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid var(--霜蓝);
  border-radius: 8px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid var(--霜蓝);
  border-radius: 8px;
  background: white;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.results-table th,
.results-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--浅雾);
}

.results-table th {
  background: var(--浅雾);
  font-weight: 600;
  color: var(--浅青灰);
}

.results-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.results-table th.sortable:hover {
  background: var(--霜蓝);
}

.sort-icon {
  margin-left: 5px;
  font-size: 0.8rem;
}

.results-table tbody tr:hover {
  background: var(--浅雾);
}

.empty-row {
  text-align: center;
  color: var(--text-light);
  padding: 40px !important;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.badge-国央企 {
  background: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

.badge-大厂 {
  background: rgba(156, 39, 176, 0.1);
  color: #9C27B0;
}

.badge-第三方 {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

.link {
  color: var(--深霜蓝);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-有效 {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.status-无效 {
  background: rgba(239, 83, 80, 0.1);
  color: #ef5350;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: var(--浅雾);
  border: 1px solid var(--霜蓝);
  border-radius: 8px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: var(--浅青灰);
}

/* 日志面板 */
.log-content {
  max-height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  border-radius: 10px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #888;
}

.log-level {
  color: var(--霜蓝);
  font-weight: 600;
}

.log-message {
  color: #ddd;
}

.log-info {
  color: #ddd;
}

.log-success {
  color: #4CAF50;
}

.log-warning {
  color: #FF9800;
}

.log-error {
  color: #ef5350;
}

.log-empty {
  text-align: center;
  color: #888;
  padding: 40px;
}

/* 按钮样式 */
.export-btn,
.clear-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.export-btn {
  background: var(--浅青灰);
  color: var(--米白);
}

.export-btn:hover:not(:disabled) {
  background: var(--text-dark);
}

.clear-btn {
  background: rgba(239, 83, 80, 0.1);
  color: #ef5350;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(239, 83, 80, 0.2);
}

.export-btn:disabled,
.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 响应式 */
@media (max-width: 1024px) {
  .keyword-config {
    grid-template-columns: 1fr;
  }

  .channel-groups {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .crawler-container {
    padding: 0 15px;
  }

  section {
    padding: 20px;
  }

  .control-section {
    flex-direction: column;
  }

  .control-btn {
    width: 100%;
  }

  .table-filters {
    flex-direction: column;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .results-table {
    font-size: 0.8rem;
  }

  .results-table th,
  .results-table td {
    padding: 8px 10px;
  }
}
</style>
