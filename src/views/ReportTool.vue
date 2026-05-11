<template>
  <div class="report-tool-page">
    <div class="page-header">
      <h1 class="page-title">研报解析工具</h1>
      <p class="page-subtitle">上传期货月报 PDF，自动解析并结构化存储</p>
      <div class="header-divider"></div>
    </div>

    <div class="tool-container">
      <!-- 上传区域 -->
      <section class="upload-section">
        <h2 class="section-title">1. 上传研报 PDF</h2>
        <div
          class="upload-area"
          @click="triggerUpload"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDragOver }"
        >
          <input
            ref="fileInput"
            type="file"
            accept="application/pdf"
            @change="handleFileChange"
            style="display: none"
          />
          <div v-if="!uploadedFile" class="upload-placeholder">
            <span class="upload-icon">📄</span>
            <span class="upload-text">点击或拖拽上传研报 PDF</span>
            <span class="upload-hint">支持期货月报、行业研报等 PDF 文件</span>
          </div>
          <div v-else class="upload-preview">
            <span class="file-icon">📕</span>
            <div class="file-info">
              <span class="file-name">{{ uploadedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(uploadedFile.size) }}</span>
            </div>
            <button @click.stop="clearFile" class="clear-btn">×</button>
          </div>
        </div>

        <!-- 研报基本信息 -->
        <div v-if="uploadedFile" class="report-meta">
          <div class="form-group">
            <label>研报标题 *</label>
            <input
              v-model="reportForm.title"
              type="text"
              placeholder="例如：【原油月报20260508】：等待空配"
              class="form-input"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>研报类型 *</label>
              <select v-model="reportForm.reportType" class="form-select">
                <option value="monthly">月报</option>
                <option value="weekly">周报</option>
                <option value="daily">日报</option>
                <option value="special">专题报告</option>
              </select>
            </div>
            <div class="form-group">
              <label>品种 *</label>
              <select v-model="reportForm.category" class="form-select">
                <option value="原油">原油</option>
                <option value="黄金">黄金</option>
                <option value="铜">铜</option>
                <option value="股指">股指</option>
                <option value="国债">国债</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>报告日期 *</label>
              <input
                v-model="reportForm.reportDate"
                type="date"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>研究机构</label>
              <input
                v-model="reportForm.institution"
                type="text"
                placeholder="例如：五矿期货"
                class="form-input"
              />
            </div>
          </div>
        </div>
      </section>

      <!-- 解析控制 -->
      <section v-if="uploadedFile" class="parse-section">
        <h2 class="section-title">2. 解析配置</h2>

        <div class="parse-config">
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="parseConfig.extractText" checked />
              提取全文文本
            </label>
          </div>
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="parseConfig.extractTables" checked />
              提取表格数据
            </label>
          </div>
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="parseConfig.autoSection" checked />
              自动板块拆分
            </label>
          </div>
        </div>

        <button
          @click="parsePDF"
          class="parse-btn"
          :disabled="isParsing"
        >
          {{ isParsing ? '解析中...' : '开始解析' }}
        </button>
      </section>

      <!-- 解析结果 -->
      <section v-if="parseResult" class="result-section">
        <h2 class="section-title">3. 解析结果</h2>

        <div class="result-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>

        <!-- 文本内容 -->
        <div v-if="activeTab === 'text'" class="tab-content">
          <div v-if="parseResult.sections.length > 0" class="sections-list">
            <div
              v-for="(section, index) in parseResult.sections"
              :key="index"
              class="section-item"
            >
              <h3 class="section-title">{{ section.title }}</h3>
              <p class="section-content">{{ section.content }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📝</span>
            <p>未检测到板块内容</p>
          </div>
        </div>

        <!-- 表格内容 -->
        <div v-if="activeTab === 'tables'" class="tab-content">
          <div v-if="parseResult.tables.length > 0" class="tables-list">
            <div
              v-for="(table, index) in parseResult.tables"
              :key="index"
              class="table-item"
            >
              <h4>表格 {{ index + 1 }}</h4>
              <div class="table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th v-for="(header, hIndex) in table.headers" :key="hIndex">
                        {{ header }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rIndex) in table.rows" :key="rIndex">
                      <td v-for="(cell, cIndex) in row" :key="cIndex">
                        {{ cell }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <span class="empty-icon">📊</span>
            <p>未检测到表格</p>
          </div>
        </div>

        <!-- 元数据 -->
        <div v-if="activeTab === 'meta'" class="tab-content">
          <div class="meta-info">
            <div class="meta-item">
              <span class="meta-label">总页数：</span>
              <span class="meta-value">{{ parseResult.pageCount }} 页</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">文本长度：</span>
              <span class="meta-value">{{ parseResult.textLength }} 字符</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">板块数量：</span>
              <span class="meta-value">{{ parseResult.sections.length }} 个</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">表格数量：</span>
              <span class="meta-value">{{ parseResult.tables.length }} 个</span>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="save-actions">
          <button @click="saveReport" class="save-btn" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '保存到数据库' }}
          </button>
          <button @click="clearAll" class="reset-btn">重新上传</button>
        </div>
      </section>

      <!-- 研报列表 -->
      <section class="reports-section">
        <h2 class="section-title">已保存的研报</h2>

        <div class="filter-bar">
          <select v-model="filterCategory" class="filter-select">
            <option value="">全部品种</option>
            <option value="原油">原油</option>
            <option value="黄金">黄金</option>
            <option value="铜">铜</option>
            <option value="股指">股指</option>
          </select>
          <select v-model="filterType" class="filter-select">
            <option value="">全部类型</option>
            <option value="monthly">月报</option>
            <option value="weekly">周报</option>
            <option value="daily">日报</option>
          </select>
        </div>

        <div class="reports-list">
          <div
            v-for="report in filteredReports"
            :key="report.id"
            class="report-card"
            @click="viewReport(report)"
          >
            <div class="report-header">
              <span class="report-type-badge">{{ getReportTypeLabel(report.report_type) }}</span>
              <span class="report-category">{{ report.category }}</span>
            </div>
            <h3 class="report-title">{{ report.title }}</h3>
            <div class="report-meta">
              <span class="report-institution">{{ report.institution || '未知机构' }}</span>
              <span class="report-date">{{ report.report_date }}</span>
            </div>
            <div class="report-stats">
              <span class="stat">{{ report.sections_count || 0 }} 个板块</span>
              <span class="stat">{{ report.tables_count || 0 }} 个表格</span>
            </div>
          </div>
        </div>

        <div v-if="filteredReports.length === 0" class="empty-state">
          <span class="empty-icon">📂</span>
          <p>暂无研报</p>
        </div>
      </section>
    </div>

    <!-- 研报详情弹窗 -->
    <div v-if="showReportDetail" class="modal-overlay" @click.self="showReportDetail = false">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h3>{{ selectedReport?.title }}</h3>
          <button @click="showReportDetail = false" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-tabs">
            <button
              v-for="tab in detailTabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeDetailTab === tab.id }"
              @click="activeDetailTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>

          <!-- 板块内容 -->
          <div v-if="activeDetailTab === 'sections'" class="detail-content">
            <div
              v-for="(section, index) in selectedReportSections"
              :key="index"
              class="detail-section"
            >
              <h4>{{ section.section_name || section.title }}</h4>
              <p>{{ section.content }}</p>
            </div>
          </div>

          <!-- 表格内容 -->
          <div v-if="activeDetailTab === 'tables'" class="detail-content">
            <div
              v-for="(table, index) in selectedReportTables"
              :key="index"
              class="detail-table"
            >
              <h4>表格 {{ index + 1 }}</h4>
              <div class="table-wrapper">
                <table class="data-table">
                  <tbody>
                    <tr v-for="(row, rIndex) in table.data" :key="rIndex">
                      <td v-for="(cell, cIndex) in row" :key="cIndex">
                        {{ cell }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'

// 配置 PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const fileInput = ref(null)
const uploadedFile = ref(null)
const isDragOver = ref(false)
const isParsing = ref(false)
const isSaving = ref(false)
const parseResult = ref(null)
const activeTab = ref('text')
const activeDetailTab = ref('sections')
const showReportDetail = ref(false)
const selectedReport = ref(null)

// 研报表单
const reportForm = ref({
  title: '',
  reportType: 'monthly',
  category: '原油',
  reportDate: new Date().toISOString().split('T')[0],
  institution: '五矿期货'
})

// 解析配置
const parseConfig = ref({
  extractText: true,
  extractTables: true,
  autoSection: true
})

// 研报列表
const reports = ref([])
const filterCategory = ref('')
const filterType = ref('')

// 板块关键词配置
const SECTION_KEYWORDS = [
  '月度评估', '策略推荐', '宏观', '地缘',
  '油品价差', '原油供应', '原油需求',
  '原油库存', '地理气象', '另类数据',
  '投资策略', '风险提示', '结论'
]

// 标签页
const tabs = [
  { id: 'text', name: '文本内容' },
  { id: 'tables', name: '表格数据' },
  { id: 'meta', name: '元数据' }
]

const detailTabs = [
  { id: 'sections', name: '板块内容' },
  { id: 'tables', name: '表格数据' }
]

// 过滤后的研报列表
const filteredReports = computed(() => {
  return reports.value.filter(report => {
    if (filterCategory.value && report.category !== filterCategory.value) return false
    if (filterType.value && report.report_type !== filterType.value) return false
    return true
  })
})

// 选中的研报板块和表格
const selectedReportSections = computed(() => {
  return selectedReport.value?.sections || []
})

const selectedReportTables = computed(() => {
  return selectedReport.value?.tables || []
})

// 文件操作
const triggerUpload = () => {
  fileInput.value.click()
}

const handleDragOver = () => {
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    uploadedFile.value = file
    // 自动填充标题
    reportForm.value.title = file.name.replace('.pdf', '')
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    uploadedFile.value = file
    reportForm.value.title = file.name.replace('.pdf', '')
  }
}

const clearFile = () => {
  uploadedFile.value = null
  parseResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// PDF 解析
const parsePDF = async () => {
  if (!uploadedFile.value) return

  isParsing.value = true

  try {
    const arrayBuffer = await uploadedFile.value.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const fullText = []
    const sections = []
    const tables = []
    let currentSection = null
    let sectionContent = []

    // 遍历所有页面
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText.push(pageText)

      // 检测板块
      if (parseConfig.value.autoSection) {
        for (const keyword of SECTION_KEYWORDS) {
          if (pageText.includes(keyword)) {
            if (currentSection && currentSection !== keyword) {
              sections.push({
                title: currentSection,
                content: sectionContent.join(' ').trim()
              })
              sectionContent = []
            }
            currentSection = keyword
            break
          }
        }
        sectionContent.push(pageText)
      }
    }

    // 添加最后一个板块
    if (currentSection && sectionContent.length > 0) {
      sections.push({
        title: currentSection,
        content: sectionContent.join(' ').trim()
      })
    }

    // 如果没有检测到板块，创建默认板块
    if (sections.length === 0 && parseConfig.value.extractText) {
      sections.push({
        title: '全文',
        content: fullText.join(' ')
      })
    }

    parseResult.value = {
      pageCount: pdf.numPages,
      textLength: fullText.join('').length,
      sections: sections,
      tables: tables, // PDF.js 表格提取功能有限，需要额外处理
      fullText: fullText.join('\n')
    }

  } catch (error) {
    console.error('PDF 解析失败:', error)
    alert('PDF 解析失败：' + error.message)
  } finally {
    isParsing.value = false
  }
}

// 保存研报
const saveReport = async () => {
  if (!reportForm.value.title) {
    alert('请输入研报标题')
    return
  }

  if (!parseResult.value) {
    alert('请先解析 PDF')
    return
  }

  isSaving.value = true

  try {
    // 这里应该调用 API 保存到数据库
    // 示例：await saveReportToDatabase(reportData)

    const reportData = {
      title: reportForm.value.title,
      report_type: reportForm.value.reportType,
      category: reportForm.value.category,
      report_date: reportForm.value.reportDate,
      institution: reportForm.value.institution,
      file_name: uploadedFile.value.name,
      page_count: parseResult.value.pageCount,
      text_length: parseResult.value.textLength,
      sections_count: parseResult.value.sections.length,
      tables_count: parseResult.value.tables.length,
      sections: parseResult.value.sections,
      tables: parseResult.value.tables,
      created_at: new Date().toISOString()
    }

    // 模拟保存（实际应该调用 API）
    reports.value.unshift({
      id: Date.now(),
      ...reportData
    })

    alert('研报保存成功！')

    // 清空表单
    clearAll()

  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

const clearAll = () => {
  uploadedFile.value = null
  parseResult.value = null
  reportForm.value = {
    title: '',
    reportType: 'monthly',
    category: '原油',
    reportDate: new Date().toISOString().split('T')[0],
    institution: '五矿期货'
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const viewReport = (report) => {
  selectedReport.value = report
  showReportDetail.value = true
}

const getReportTypeLabel = (type) => {
  const labels = {
    monthly: '月报',
    weekly: '周报',
    daily: '日报',
    special: '专题'
  }
  return labels[type] || '其他'
}

// 加载已保存的研报列表
onMounted(() => {
  // 这里应该从数据库加载
  // 示例：reports.value = await getReportsFromDatabase()
})
</script>

<style scoped>
.report-tool-page {
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

.tool-container {
  max-width: 1200px;
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
  letter-spacing: 0.2rem;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--霜蓝);
  border-radius: 15px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: var(--深霜蓝);
  background: var(--浅雾);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--浅青灰);
}

.upload-icon {
  font-size: 3rem;
}

.upload-text {
  font-size: 1.1rem;
  font-weight: 300;
}

.upload-hint {
  font-size: 0.9rem;
  color: var(--text-light);
}

.upload-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: white;
  border-radius: 10px;
  width: 100%;
  max-width: 400px;
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-name {
  font-size: 0.95rem;
  color: var(--text-dark);
  font-weight: 500;
}

.file-size {
  font-size: 0.85rem;
  color: var(--text-light);
}

.clear-btn {
  width: 32px;
  height: 32px;
  background: var(--浅雾);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--浅青灰);
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #ef5350;
  color: white;
}

/* 表单样式 */
.report-meta {
  margin-top: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  color: var(--text-dark);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

/* 解析配置 */
.parse-config {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.config-item label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--浅青灰);
  cursor: pointer;
}

.parse-btn {
  width: 100%;
  padding: 15px 30px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  letter-spacing: 0.15rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.parse-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.parse-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 解析结果 */
.result-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--浅雾);
}

.tab-btn {
  padding: 12px 25px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: var(--深霜蓝);
  border-bottom-color: var(--深霜蓝);
}

.tab-content {
  padding: 20px 0;
}

.section-item {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.section-item h3 {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.section-content {
  color: var(--text-dark);
  line-height: 1.8;
  white-space: pre-wrap;
}

.table-item {
  margin-bottom: 30px;
}

.table-item h4 {
  font-size: 1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--浅雾);
  border-radius: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--浅雾);
}

.data-table th {
  background: var(--浅雾);
  color: var(--浅青灰);
  font-weight: 500;
}

.data-table td {
  color: var(--text-dark);
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.meta-item {
  padding: 15px;
  background: white;
  border-radius: 10px;
}

.meta-label {
  font-size: 0.9rem;
  color: var(--text-light);
}

.meta-value {
  font-size: 1.1rem;
  color: var(--浅青灰);
  font-weight: 500;
}

.save-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.save-btn {
  flex: 1;
  padding: 15px 30px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.reset-btn {
  padding: 15px 30px;
  background: var(--浅雾);
  color: var(--浅青灰);
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

/* 研报列表 */
.filter-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.filter-select {
  padding: 10px 20px;
  border: 1px solid var(--霜蓝);
  border-radius: 10px;
  background: white;
  color: var(--浅青灰);
  cursor: pointer;
}

.reports-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.report-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.report-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(200, 217, 230, 0.2);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.report-type-badge {
  padding: 5px 12px;
  background: var(--浅雾);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--深霜蓝);
}

.report-category {
  padding: 5px 12px;
  background: var(--霜蓝);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--米白);
}

.report-title {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 12px;
  font-weight: 400;
}

.report-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--text-light);
  margin-bottom: 12px;
}

.report-stats {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: var(--深霜蓝);
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-light);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 1200px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-header h3 {
  font-size: 1.5rem;
  color: var(--浅青灰);
}

.modal-close {
  width: 40px;
  height: 40px;
  border: none;
  background: var(--浅雾);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--浅青灰);
}

.modal-body {
  padding: 20px 0;
}

.detail-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--浅雾);
}

.detail-content {
  padding: 20px 0;
}

.detail-section {
  margin-bottom: 25px;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.detail-section h4 {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.detail-table {
  margin-bottom: 25px;
}

@media (max-width: 768px) {
  .page-title {
    letter-spacing: 0.3rem;
  }

  section {
    padding: 30px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .reports-list {
    grid-template-columns: 1fr;
  }
}
</style>
