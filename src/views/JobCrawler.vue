<template>
  <div class="job-crawler-page">
    <div class="page-header">
      <h1 class="page-title">招聘投递链接提取</h1>
      <p class="page-subtitle">从公众号文章中快速提取投递链接</p>
      <div class="header-divider"></div>
    </div>

    <div class="crawler-container">
      <!-- 输入区域 -->
      <section class="input-section">
        <h2 class="section-title">输入内容</h2>

        <div class="input-tabs">
          <button
            class="tab-btn"
            :class="{ active: inputMode === 'url' }"
            @click="inputMode = 'url'"
          >
            文章链接
          </button>
          <button
            class="tab-btn"
            :class="{ active: inputMode === 'content' }"
            @click="inputMode = 'content'"
          >
            文章内容
          </button>
          <button
            class="tab-btn"
            :class="{ active: inputMode === 'batch' }"
            @click="inputMode = 'batch'"
          >
            批量链接
          </button>
        </div>

        <!-- 单个链接模式 -->
        <div v-if="inputMode === 'url'" class="input-group">
          <label>文章链接</label>
          <input
            v-model="singleUrl"
            type="url"
            placeholder="粘贴微信公众号文章链接"
            class="url-input"
          />
          <button @click="fetchArticle" class="action-btn" :disabled="loading || !singleUrl">
            {{ loading ? '获取中...' : '获取文章' }}
          </button>
        </div>

        <!-- 文章内容模式 -->
        <div v-if="inputMode === 'content'" class="input-group">
          <label>文章内容</label>
          <textarea
            v-model="articleContent"
            placeholder="粘贴文章内容或HTML..."
            class="content-textarea"
            rows="10"
          ></textarea>
          <button @click="extractFromContent" class="action-btn">
            提取链接
          </button>
        </div>

        <!-- 批量链接模式 -->
        <div v-if="inputMode === 'batch'" class="input-group">
          <label>批量链接 (每行一个)</label>
          <textarea
            v-model="batchUrls"
            placeholder="https://mp.weixin.qq.com/s/xxxxx&#10;https://mp.weixin.qq.com/s/yyyyy&#10;..."
            class="content-textarea"
            rows="10"
          ></textarea>
          <div class="batch-actions">
            <button @click="processBatch" class="action-btn" :disabled="loading">
              {{ loading ? `处理中 (${batchProgress.current}/${batchProgress.total})` : '批量处理' }}
            </button>
            <button @click="clearBatch" class="secondary-btn">清空</button>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </section>

      <!-- 结果区域 -->
      <section v-if="results.length > 0" class="results-section">
        <div class="results-header">
          <h2 class="section-title">提取结果</h2>
          <div class="results-stats">
            共 {{ results.length }} 篇文章，
            {{ totalLinks }} 个投递链接
          </div>
        </div>

        <!-- 筛选 -->
        <div class="filter-bar">
          <label>筛选类型：</label>
          <button
            v-for="type in linkTypes"
            :key="type"
            class="filter-btn"
            :class="{ active: selectedTypes.includes(type) }"
            @click="toggleType(type)"
          >
            {{ type }}
          </button>
        </div>

        <!-- 结果列表 -->
        <div class="results-list">
          <div
            v-for="(article, index) in filteredResults"
            :key="index"
            class="article-card"
          >
            <div class="article-header">
              <h3 class="article-title">{{ article.title }}</h3>
              <span class="link-count">{{ article.links.length }} 个链接</span>
            </div>

            <div class="links-list">
              <div
                v-for="(link, linkIndex) in article.links"
                :key="linkIndex"
                class="link-item"
              >
                <span class="link-type" :class="`type-${link.type}`">{{ link.type }}</span>
                <a :href="link.url" target="_blank" class="link-url">
                  {{ truncateUrl(link.url) }}
                </a>
                <button
                  @click="copyLink(link.url)"
                  class="copy-btn"
                  title="复制链接"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 导出操作 -->
        <div class="export-section">
          <button @click="exportCSV" class="export-btn">
            📥 导出 CSV
          </button>
          <button @click="copyAllLinks" class="export-btn">
            📋 复制所有链接
          </button>
          <button @click="clearResults" class="secondary-btn">
            清空结果
          </button>
        </div>
      </section>

      <!-- 使用说明 -->
      <section class="help-section">
        <h2 class="section-title">使用说明</h2>
        <div class="help-content">
          <h3>如何获取公众号文章链接？</h3>
          <ol>
            <li>在微信中打开公众号文章</li>
            <li>点击右上角 "..." 菜单</li>
            <li>选择 "复制链接"</li>
            <li>粘贴到上方输入框</li>
          </ol>

          <h3>支持的平台</h3>
          <div class="platform-grid">
            <span class="platform-tag">牛客网</span>
            <span class="platform-tag">猎聘</span>
            <span class="platform-tag">BOSS直聘</span>
            <span class="platform-tag">拉勾</span>
            <span class="platform-tag">前程无忧</span>
            <span class="platform-tag">问卷星</span>
            <span class="platform-tag">腾讯文档</span>
            <span class="platform-tag">各大厂招聘官网</span>
          </div>
        </div>
      </section>
    </div>

    <!-- 复制成功提示 -->
    <transition name="fade">
      <div v-if="showCopyToast" class="toast">
        已复制到剪贴板
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  extractApplicationLinks,
  filterApplicationLinks,
  exportToCSV,
  copyToClipboard
} from '../utils/wechat-crawler'

const inputMode = ref('url')
const singleUrl = ref('')
const articleContent = ref('')
const batchUrls = ref('')
const loading = ref(false)
const error = ref('')
const results = ref([])
const selectedTypes = ref([])
const showCopyToast = ref(false)
const batchProgress = ref({ current: 0, total: 0 })

const linkTypes = computed(() => {
  const types = new Set()
  results.value.forEach(article => {
    article.links.forEach(link => types.add(link.type))
  })
  return Array.from(types)
})

const totalLinks = computed(() => {
  return results.value.reduce((sum, article) => sum + article.links.length, 0)
})

const filteredResults = computed(() => {
  if (selectedTypes.value.length === 0) return results.value

  return results.value.map(article => ({
    ...article,
    links: article.links.filter(link => selectedTypes.value.includes(link.type))
  })).filter(article => article.links.length > 0)
})

const fetchArticle = async () => {
  if (!singleUrl.value) return

  loading.value = true
  error.value = ''

  try {
    // 注意：由于CORS限制，直接在前端请求微信文章可能失败
    // 建议使用后端代理或用户手动复制内容
    const response = await fetch(singleUrl.value)
    const html = await response.text()

    processArticleContent('从链接获取的文章', html, singleUrl.value)
  } catch (err) {
    error.value = '获取文章失败，可能是跨域限制。请尝试复制文章内容模式。'
    console.error('获取文章失败:', err)
  } finally {
    loading.value = false
  }
}

const extractFromContent = () => {
  if (!articleContent.value.trim()) {
    error.value = '请输入文章内容'
    return
  }

  processArticleContent('手动输入的文章', articleContent.value, '')
}

const processBatch = async () => {
  const urls = batchUrls.value
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))

  if (urls.length === 0) {
    error.value = '请输入至少一个链接'
    return
  }

  loading.value = true
  error.value = ''
  batchProgress.value = { current: 0, total: urls.length }

  for (let i = 0; i < urls.length; i++) {
    batchProgress.value.current = i + 1

    try {
      // 由于CORS，这里也需要用户手动获取内容
      // 或者使用后端API
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error(`处理链接 ${i + 1} 失败:`, err)
    }
  }

  loading.value = false
  error.value = '批量处理功能需要后端支持，请使用单个链接或内容模式'
}

const processArticleContent = (title, content, url) => {
  const links = extractApplicationLinks(content)
  const appLinks = filterApplicationLinks(links)

  if (appLinks.length === 0) {
    error.value = '未找到投递链接'
    return
  }

  results.value.unshift({
    title,
    url,
    links: appLinks,
    timestamp: Date.now()
  })

  error.value = ''
}

const truncateUrl = (url) => {
  return url.length > 80 ? url.substring(0, 80) + '...' : url
}

const copyLink = async (url) => {
  const success = await copyToClipboard(url)
  if (success) {
    showCopyToast.value = true
    setTimeout(() => {
      showCopyToast.value = false
    }, 2000)
  }
}

const copyAllLinks = async () => {
  const allLinks = filteredResults.value
    .flatMap(article => article.links)
    .map(link => link.url)
    .join('\n')

  const success = await copyToClipboard(allLinks)
  if (success) {
    showCopyToast.value = true
    setTimeout(() => {
      showCopyToast.value = false
    }, 2000)
  }
}

const toggleType = (type) => {
  const index = selectedTypes.value.indexOf(type)
  if (index > -1) {
    selectedTypes.value.splice(index, 1)
  } else {
    selectedTypes.value.push(type)
  }
}

const exportCSV = () => {
  exportToCSV(filteredResults.value, '投递链接.csv')
}

const clearBatch = () => {
  batchUrls.value = ''
}

const clearResults = () => {
  results.value = []
  selectedTypes.value = []
  error.value = ''
}
</script>

<style scoped>
.job-crawler-page {
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
  letter-spacing: 0.5rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--深霜蓝);
  letter-spacing: 0.3rem;
  font-weight: 200;
  margin-bottom: 30px;
}

.header-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 0 auto;
}

.crawler-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 30px;
}

section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.section-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  margin-bottom: 25px;
  font-weight: 400;
}

.input-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid var(--浅雾);
  padding-bottom: 15px;
}

.tab-btn {
  padding: 12px 25px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.tab-btn.active {
  border-bottom-color: var(--深霜蓝);
  color: var(--深霜蓝);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.url-input,
.content-textarea {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.url-input:focus,
.content-textarea:focus {
  outline: none;
  border-color: var(--深霜蓝);
  box-shadow: 0 0 0 3px rgba(200, 217, 230, 0.2);
}

.content-textarea {
  font-family: monospace;
  resize: vertical;
}

.action-btn,
.secondary-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.15rem;
}

.action-btn {
  background: var(--浅青灰);
  color: var(--米白);
}

.action-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.secondary-btn:hover {
  background: var(--霜蓝);
}

.batch-actions {
  display: flex;
  gap: 15px;
}

.error-message {
  padding: 15px 20px;
  background: rgba(239, 83, 80, 0.1);
  border: 1px solid #ef5350;
  border-radius: 12px;
  color: #ef5350;
  margin-top: 15px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-stats {
  font-size: 0.9rem;
  color: var(--深霜蓝);
  font-weight: 600;
}

.filter-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  padding: 15px 20px;
  background: var(--浅雾);
  border-radius: 12px;
  margin-bottom: 20px;
}

.filter-bar label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  margin-right: 10px;
}

.filter-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid var(--霜蓝);
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn.active {
  background: var(--深霜蓝);
  border-color: var(--深霜蓝);
  color: white;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  border: 2px solid var(--浅雾);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--浅雾);
}

.article-title {
  font-size: 1.1rem;
  color: var(--浅青灰);
  font-weight: 500;
}

.link-count {
  padding: 6px 12px;
  background: var(--深霜蓝);
  color: white;
  border-radius: 15px;
  font-size: 0.8rem;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  background: var(--浅雾);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.link-item:hover {
  background: var(--霜蓝);
}

.link-type {
  padding: 4px 10px;
  background: var(--深霜蓝);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
}

.link-url {
  flex: 1;
  color: var(--text-dark);
  text-decoration: none;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-url:hover {
  color: var(--深霜蓝);
  text-decoration: underline;
}

.copy-btn {
  width: 32px;
  height: 32px;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.copy-btn:hover {
  background: var(--深霜蓝);
  transform: scale(1.1);
}

.export-section {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 25px;
  padding-top: 25px;
  border-top: 2px solid var(--浅雾);
}

.export-btn {
  flex: 1;
  min-width: 150px;
  padding: 15px 25px;
  background: var(--浅青灰);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.export-btn:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.help-content {
  color: var(--text-dark);
  line-height: 1.8;
}

.help-content h3 {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-top: 20px;
  margin-bottom: 15px;
}

.help-content ol {
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 10px;
}

.platform-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.platform-tag {
  padding: 8px 16px;
  background: var(--浅雾);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--浅青灰);
}

.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 30px;
  background: var(--浅青灰);
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
