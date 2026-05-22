<template>
  <div class="transcribe-tool-page">
    <div class="page-header">
      <h1 class="page-title">录音转文字</h1>
      <p class="page-subtitle">使用 OpenAI Whisper 将语音转换为文字</p>
      <div class="header-divider"></div>
    </div>

    <div class="tool-container">
      <!-- API Key 设置 -->
      <section class="api-section">
        <h2 class="section-title">API 设置</h2>
        <div class="api-input-group">
          <label>OpenAI API Key</label>
          <input
            v-model="apiKey"
            type="password"
            placeholder="sk-..."
            class="api-input"
            @input="saveApiKey"
          />
          <span class="api-hint">您的 API Key 将保存在本地浏览器中</span>
        </div>
      </section>

      <!-- 录音区域 -->
      <section class="record-section">
        <h2 class="section-title">录音</h2>

        <div class="record-controls">
          <button
            @click="toggleRecording"
            class="record-btn"
            :class="{ recording: isRecording }"
            :disabled="!apiKey"
          >
            <span class="record-icon">{{ isRecording ? '⏹' : '🎤' }}</span>
            <span class="record-text">{{ isRecording ? '停止录音' : '开始录音' }}</span>
          </button>

          <div class="record-status">
            <span v-if="isRecording" class="recording-indicator">
              <span class="recording-dot"></span>
              录音中... {{ recordingTime }}
            </span>
            <span v-else-if="audioBlob" class="audio-ready">
              ✓ 已录制 {{ formatDuration(recordingDuration) }}
            </span>
          </div>
        </div>

        <!-- 录音预览 -->
        <div v-if="audioUrl" class="audio-preview">
          <audio :src="audioUrl" controls></audio>
        </div>
      </section>

      <!-- 文件上传区域 -->
      <section class="upload-section">
        <h2 class="section-title">或上传音频文件</h2>

        <div
          class="upload-area"
          @click="triggerFileInput"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
          :class="{ 'drag-over': isDragOver }"
        >
          <input
            ref="fileInput"
            type="file"
            accept="audio/*"
            @change="handleFileChange"
            style="display: none"
          />

          <div v-if="!uploadedFile" class="upload-placeholder">
            <span class="upload-icon">📁</span>
            <span class="upload-text">点击或拖拽上传音频文件</span>
            <span class="upload-hint">
              支持 MP3, WAV, M4A, WEBM 等格式，最大 25MB
            </span>
          </div>

          <div v-else class="upload-preview">
            <span class="file-icon">🎵</span>
            <div class="file-info">
              <span class="file-name">{{ uploadedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(uploadedFile.size) }}</span>
            </div>
            <button @click.stop="clearFile" class="clear-btn">×</button>
          </div>
        </div>
      </section>

      <!-- 配置选项 -->
      <section class="config-section">
        <h2 class="section-title">转录配置</h2>

        <div class="config-grid">
          <div class="config-item">
            <label>语言</label>
            <select v-model="config.language" class="config-select">
              <option value="">自动检测</option>
              <option
                v-for="lang in SUPPORTED_LANGUAGES"
                :key="lang.code"
                :value="lang.code"
              >
                {{ lang.name }}
              </option>
            </select>
          </div>

          <div class="config-item">
            <label>提示词（可选）</label>
            <input
              v-model="config.prompt"
              type="text"
              placeholder="例如：这是一段关于技术讨论的录音..."
              class="config-input"
            />
          </div>

          <div class="config-item">
            <label>响应格式</label>
            <select v-model="config.responseFormat" class="config-select">
              <option value="text">纯文本</option>
              <option value="json">JSON</option>
              <option value="srt">SRT 字幕</option>
              <option value="verbose_json">详细 JSON</option>
            </select>
          </div>

          <div class="config-item">
            <label>温度 ({{ config.temperature }})</label>
            <input
              v-model.number="config.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="config-range"
            />
          </div>
        </div>
      </section>

      <!-- 转录按钮 -->
      <section class="action-section">
        <button
          @click="transcribe"
          class="transcribe-btn"
          :disabled="!canTranscribe || isTranscribing"
        >
          <span v-if="isTranscribing" class="loading-spinner"></span>
          {{ isTranscribing ? '转录中...' : '开始转录' }}
        </button>
      </section>

      <!-- 结果区域 -->
      <section v-if="result" class="result-section">
        <div class="result-header">
          <h2 class="section-title">转录结果</h2>
          <div class="result-actions">
            <button @click="copyResult" class="action-btn">📋 复制</button>
            <button @click="saveToGallery" class="action-btn">💾 保存到画廊</button>
            <button @click="exportResult" class="action-btn">📥 导出</button>
          </div>
        </div>

        <div class="result-content">
          <div class="transcript-text" v-if="typeof result === 'string'">
            {{ result }}
          </div>

          <div v-else class="transcript-json">
            <pre>{{ JSON.stringify(result, null, 2) }}</pre>
          </div>
        </div>

        <!-- 转录信息 -->
        <div v-if="transcriptMeta" class="transcript-meta">
          <div class="meta-item">
            <span class="meta-label">语言:</span>
            <span class="meta-value">{{ transcriptMeta.language }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">时长:</span>
            <span class="meta-value">{{ transcriptMeta.duration }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">文字数:</span>
            <span class="meta-value">{{ result.length }} 字</span>
          </div>
        </div>
      </section>

      <!-- 历史记录 -->
      <section v-if="history.length > 0" class="history-section">
        <h2 class="section-title">历史记录</h2>
        <div class="history-list">
          <div
            v-for="(item, index) in history"
            :key="index"
            class="history-item"
            @click="loadHistoryItem(index)"
          >
            <div class="history-info">
              <span class="history-time">{{ item.time }}</span>
              <span class="history-preview">{{ item.text.substring(0, 50) }}...</span>
            </div>
            <button @click.stop="deleteHistoryItem(index)" class="delete-btn">×</button>
          </div>
        </div>
      </section>
    </div>

    <!-- 保存到画廊弹窗 -->
    <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>保存到画廊</h3>
          <button @click="showSaveModal = false" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveToGalleryConfirm" class="save-form">
          <div class="form-group">
            <label>标题 *</label>
            <input
              v-model="saveForm.title"
              type="text"
              placeholder="为你的转录起个名字"
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="saveForm.description"
              placeholder="描述这段录音的内容..."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="saveForm.categoryId" class="form-select">
                <option value="detail">细节</option>
                <option value="life">生活</option>
                <option value="winter">冬日</option>
                <option value="nature">自然</option>
              </select>
            </div>
            <div class="form-group">
              <label>日期</label>
              <input
                v-model="saveForm.date"
                type="date"
                class="form-input"
              />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showSaveModal = false" class="btn-cancel">取消</button>
            <button type="submit" class="btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { transcribeAudio, SUPPORTED_LANGUAGES, validateAudioFile } from '../utils/whisper-service'
import { addGalleryItem } from '../utils/storage'

const apiKey = ref('')
const isRecording = ref(false)
const isTranscribing = ref(false)
const isDragOver = ref(false)

// 录音相关
let mediaRecorder = null
let audioChunks = []
let recordingInterval = null
const recordingDuration = ref(0)
const audioBlob = ref(null)
const audioUrl = ref(null)

// 文件上传
const fileInput = ref(null)
const uploadedFile = ref(null)

// 配置
const config = ref({
  language: '',
  prompt: '',
  responseFormat: 'text',
  temperature: 0
})

// 结果
const result = ref(null)
const transcriptMeta = ref(null)
const history = ref([])

// 保存到画廊
const showSaveModal = ref(false)
const saveForm = ref({
  title: '',
  description: '',
  categoryId: 'detail',
  date: new Date().toISOString().split('T')[0]
})

const categoryMap = {
  detail: '细节',
  life: '生活',
  winter: '冬日',
  nature: '自然'
}

// 计算属性
const canTranscribe = computed(() => {
  return apiKey.value && (audioBlob.value || uploadedFile.value)
})

const recordingTime = computed(() => {
  const minutes = Math.floor(recordingDuration.value / 60)
  const seconds = recordingDuration.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 初始化
onMounted(() => {
  // 从本地存储加载 API Key
  const savedApiKey = localStorage.getItem('openai_api_key')
  if (savedApiKey) {
    apiKey.value = savedApiKey
  }

  // 加载历史记录
  const savedHistory = localStorage.getItem('transcribe_history')
  if (savedHistory) {
    history.value = JSON.parse(savedHistory)
  }
})

// 保存 API Key
const saveApiKey = () => {
  localStorage.setItem('openai_api_key', apiKey.value)
}

// 录音功能
const toggleRecording = async () => {
  if (isRecording.value) {
    stopRecording()
  } else {
    startRecording()
  }
}

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      audioBlob.value = blob
      audioUrl.value = URL.createObjectURL(blob)

      // 停止所有轨道
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    isRecording.value = true
    recordingDuration.value = 0

    // 计时器
    recordingInterval = setInterval(() => {
      recordingDuration.value++
    }, 1000)

  } catch (error) {
    console.error('录音失败:', error)
    alert('无法访问麦克风，请确保已授予权限')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false

    if (recordingInterval) {
      clearInterval(recordingInterval)
    }
  }
}

// 文件上传
const triggerFileInput = () => {
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
  if (file) {
    processFile(file)
  }
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    processFile(file)
  }
}

const processFile = (file) => {
  const validation = validateAudioFile(file)
  if (!validation.valid) {
    alert(validation.error)
    return
  }

  uploadedFile.value = file
  audioBlob.value = file
  audioUrl.value = URL.createObjectURL(file)
}

const clearFile = () => {
  uploadedFile.value = null
  audioBlob.value = null
  audioUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 转录
const transcribe = async () => {
  if (!canTranscribe.value) return

  isTranscribing.value = true
  result.value = null

  try {
    const response = await transcribeAudio(audioBlob.value, apiKey.value, config.value)

    // 处理结果
    if (typeof response === 'object' && response.text) {
      result.value = response.text
      transcriptMeta.value = {
        language: response.language || '自动检测',
        duration: response.duration ? formatDuration(response.duration) : '未知'
      }
    } else {
      result.value = response
    }

    // 添加到历史记录
    addToHistory(result.value)

  } catch (error) {
    console.error('转录失败:', error)
    alert('转录失败：' + error.message)
  } finally {
    isTranscribing.value = false
  }
}

// 历史记录
const addToHistory = (text) => {
  const item = {
    text,
    time: new Date().toLocaleString('zh-CN'),
    timestamp: Date.now()
  }

  history.value.unshift(item)

  // 只保留最近 20 条
  if (history.value.length > 20) {
    history.value = history.value.slice(0, 20)
  }

  // 保存到本地存储
  localStorage.setItem('transcribe_history', JSON.stringify(history.value))
}

const loadHistoryItem = (index) => {
  result.value = history.value[index].text
}

const deleteHistoryItem = (index) => {
  history.value.splice(index, 1)
  localStorage.setItem('transcribe_history', JSON.stringify(history.value))
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(result.value)
    alert('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 导出结果
const exportResult = () => {
  let content = ''
  let filename = ''
  let type = 'text/plain'

  if (config.value.responseFormat === 'json' || typeof result.value === 'object') {
    content = JSON.stringify(result.value, null, 2)
    filename = 'transcript.json'
    type = 'application/json'
  } else if (config.value.responseFormat === 'srt') {
    content = result.value
    filename = 'transcript.srt'
    type = 'text/plain'
  } else {
    content = result.value
    filename = 'transcript.txt'
    type = 'text/plain'
  }

  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 保存到画廊
const saveToGallery = () => {
  showSaveModal.value = true
}

const saveToGalleryConfirm = () => {
  const data = {
    title: saveForm.value.title,
    description: saveForm.value.description || result.value.substring(0, 100),
    category: categoryMap[saveForm.value.categoryId],
    categoryId: saveForm.value.categoryId,
    date: saveForm.value.date,
    type: 'text',
    content: result.value
  }

  addGalleryItem(data)

  // 重置表单
  saveForm.value = {
    title: '',
    description: '',
    categoryId: 'detail',
    date: new Date().toISOString().split('T')[0]
  }
  showSaveModal.value = false

  alert('已保存到画廊！')
}

// 工具函数
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<style scoped>
.transcribe-tool-page {
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
  max-width: 900px;
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

/* API 设置 */
.api-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.api-input-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.api-input {
  padding: 15px 20px;
  border: 2px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: var(--text-dark);
}

.api-hint {
  font-size: 0.8rem;
  color: var(--text-light);
}

/* 录音区域 */
.record-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.record-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 40px;
  background: var(--浅青灰);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.record-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-btn.recording {
  background: #ef5350;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.record-icon {
  font-size: 1.5rem;
}

.record-status {
  flex: 1;
  min-width: 200px;
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef5350;
  font-weight: 500;
}

.recording-dot {
  width: 10px;
  height: 10px;
  background: #ef5350;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.audio-ready {
  color: #4CAF50;
  font-weight: 500;
}

.audio-preview {
  margin-top: 20px;
}

.audio-preview audio {
  width: 100%;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--霜蓝);
  border-radius: 15px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
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
  font-size: 1rem;
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
  background: rgba(239, 83, 80, 0.2);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  color: #ef5350;
}

/* 配置区域 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-item label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.config-select,
.config-input {
  padding: 12px 16px;
  border: 1px solid var(--霜蓝);
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  color: var(--text-dark);
}

.config-range {
  width: 100%;
  cursor: pointer;
}

/* 操作区域 */
.action-section {
  text-align: center;
}

.transcribe-btn {
  padding: 18px 50px;
  background: var(--浅青灰);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.transcribe-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 154, 157, 0.3);
}

.transcribe-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 结果区域 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 10px 20px;
  background: var(--浅雾);
  border: 1px solid var(--霜蓝);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: var(--霜蓝);
}

.result-content {
  background: white;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
}

.transcript-text {
  white-space: pre-wrap;
  line-height: 1.8;
  color: var(--text-dark);
  font-size: 1.05rem;
}

.transcript-json {
  background: var(--浅雾);
  border-radius: 10px;
  padding: 20px;
  overflow-x: auto;
}

.transcript-json pre {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-dark);
}

.transcript-meta {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
  padding: 15px 20px;
  background: var(--浅雾);
  border-radius: 10px;
}

.meta-item {
  display: flex;
  gap: 8px;
  font-size: 0.9rem;
}

.meta-label {
  color: var(--text-light);
  font-weight: 500;
}

.meta-value {
  color: var(--深霜蓝);
  font-weight: 600;
}

/* 历史记录 */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: var(--浅雾);
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.history-time {
  font-size: 0.8rem;
  color: var(--text-light);
}

.history-preview {
  font-size: 0.9rem;
  color: var(--text-dark);
}

.delete-btn {
  width: 28px;
  height: 28px;
  background: rgba(239, 83, 80, 0.2);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #ef5350;
}

/* Modal 样式 */
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: var(--浅青灰);
  font-weight: 400;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--浅雾);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--浅青灰);
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--霜蓝);
  color: white;
}

.save-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.save-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.save-form .form-group label {
  font-size: 0.85rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.save-form .form-input,
.save-form .form-select,
.save-form .form-textarea {
  padding: 12px 16px;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 0.9rem;
  background: white;
  color: var(--text-dark);
}

.save-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.modal-actions {
  display: flex;
  gap: 15px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px 25px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-cancel {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.btn-save {
  background: var(--浅青灰);
  color: white;
}

.btn-cancel:hover {
  background: var(--霜蓝);
}

.btn-save:hover {
  background: var(--text-dark);
}
</style>
