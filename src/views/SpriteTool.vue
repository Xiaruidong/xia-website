<template>
  <div class="sprite-tool-page">
    <div class="page-header">
      <h1 class="page-title">雪碧图转动图</h1>
      <p class="page-subtitle">上传精灵图，自动切割并生成 GIF 动图</p>
      <div class="header-divider"></div>
    </div>

    <div class="tool-container">
      <!-- 上传区域 -->
      <section class="upload-section">
        <h2 class="section-title">1. 上传雪碧图</h2>
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
            accept="image/*"
            @change="handleFileChange"
            style="display: none"
          />
          <div v-if="!spriteImage" class="upload-placeholder">
            <span class="upload-icon">📤</span>
            <span class="upload-text">点击或拖拽上传雪碧图</span>
            <span class="upload-hint">支持 PNG、GIF 等格式，最大 5MB</span>
          </div>
          <div v-else-if="uploadLoading" class="upload-loading">
            <span class="loading-spinner"></span>
            <span>正在加载图片...</span>
          </div>
          <div v-else class="upload-preview">
            <img :src="spriteImage" />
            <button @click.stop="clearImage" class="clear-btn" :disabled="uploadLoading">×</button>
          </div>
        </div>
      </section>

      <!-- 配置区域 -->
      <section v-if="spriteImage" class="config-section">
        <h2 class="section-title">2. 配置切割参数</h2>

        <div class="config-grid">
          <div class="config-item">
            <label>单帧宽度 (px)</label>
            <input
              v-model.number="config.frameWidth"
              type="number"
              min="1"
              class="config-input"
              @input="onConfigChange"
            />
          </div>

          <div class="config-item">
            <label>单帧高度 (px)</label>
            <input
              v-model.number="config.frameHeight"
              type="number"
              min="1"
              class="config-input"
              @input="onConfigChange"
            />
          </div>

          <div class="config-item">
            <label>帧间隔 (ms)</label>
            <input
              v-model.number="config.duration"
              type="number"
              min="10"
              step="10"
              class="config-input"
            />
          </div>

          <div class="config-item">
            <label>总帧数 (0=全部)</label>
            <input
              v-model.number="config.maxFrames"
              type="number"
              min="0"
              class="config-input"
              @input="onConfigChange"
            />
            <span class="hint">当前: {{ frameCount }} 帧</span>
          </div>
        </div>

        <!-- 快捷预设 -->
        <div class="preset-section">
          <h3>常用预设</h3>
          <div class="preset-buttons">
            <button @click="applyPreset(16, 16)" class="preset-btn">16×16 像素</button>
            <button @click="applyPreset(32, 32)" class="preset-btn">32×32 像素</button>
            <button @click="applyPreset(64, 64)" class="preset-btn">64×64 像素</button>
            <button @click="detectFromImage()" class="preset-btn">自动检测</button>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="previewAnimation" class="preview-btn">
            {{ isPlaying ? '停止预览' : '预览动画' }}
          </button>
          <button @click="generateGIF" class="generate-btn" :disabled="isGenerating">
            {{ isGenerating ? '生成中...' : '生成 GIF' }}
          </button>
        </div>
      </section>

      <!-- 预览区域 -->
      <section v-if="spriteImage" class="preview-section">
        <h2 class="section-title">3. 预览</h2>

        <div class="preview-grid">
          <div class="preview-card">
            <h3>原始图片</h3>
            <div class="image-container">
              <img :src="spriteImage" class="preview-image" />
            </div>
            <p class="image-info">{{ imageInfo }}</p>
          </div>

          <div class="preview-card">
            <h3>切割预览 ({{ frameCount }} 帧)</h3>
            <div class="frames-preview">
              <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            </div>
          </div>

          <div class="preview-card">
            <h3>动画预览</h3>
            <canvas
              ref="animationCanvas"
              class="animation-canvas"
              :width="config.frameWidth"
              :height="config.frameHeight"
              :style="{
                width: Math.max(config.frameWidth, 128) + 'px',
                height: Math.max(config.frameHeight, 128) + 'px'
              }"
            ></canvas>
            <div v-if="generatedGIF" class="generated-gif">
              <h4>生成的 GIF</h4>
              <img :src="generatedGIF" class="generated-image" />
              <div class="gif-actions">
                <button @click="downloadGIF" class="download-btn">下载 GIF</button>
                <button @click="showSaveModal = true" class="save-btn">保存到画廊</button>
              </div>
            </div>

            <!-- 保存到画廊弹窗 -->
            <div v-if="showSaveModal" class="modal-overlay" @click.self="showSaveModal = false">
              <div class="modal-content">
                <div class="modal-header">
                  <h3>保存到画廊</h3>
                  <button @click="showSaveModal = false" class="modal-close">×</button>
                </div>
                <form @submit.prevent="saveToGallery" class="save-form">
                  <div class="form-group">
                    <label>标题 *</label>
                    <input
                      v-model="saveForm.title"
                      type="text"
                      placeholder="为你的动画起个名字"
                      required
                      class="form-input"
                    />
                  </div>
                  <div class="form-group">
                    <label>描述</label>
                    <textarea
                      v-model="saveForm.description"
                      placeholder="描述这个动画..."
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
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick } from 'vue'
import { addGalleryItem } from '../utils/storage'

const fileInput = ref(null)
const spriteImage = ref(null)
const imageInfo = ref('')
const generatedGIF = ref(null)
const isGenerating = ref(false)
const isDragOver = ref(false)
const isPlaying = ref(false)
const uploadLoading = ref(false)
const previewCanvas = ref(null)
const animationCanvas = ref(null)

let animationInterval = null
let debounceTimer = null

const config = ref({
  frameWidth: 32,
  frameHeight: 32,
  duration: 100,
  maxFrames: 0
})

const frames = ref([])

// 保存到画廊相关
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

const frameCount = computed(() => {
  return frames.value.length
})

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
  if (file && file.type.startsWith('image/')) {
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
  // 检查文件大小
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB')
    return
  }

  uploadLoading.value = true

  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      spriteImage.value = e.target.result

      const img = new Image()

      img.onload = async () => {
        imageInfo.value = `${img.width} × ${img.height} px`
        await detectFromImage()
        extractFrames()
        uploadLoading.value = false
      }

      img.onerror = () => {
        alert('图片加载失败')
        uploadLoading.value = false
      }

      img.src = e.target.result
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败：' + error.message)
      uploadLoading.value = false
    }
  }

  reader.onerror = () => {
    alert('文件读取失败')
    uploadLoading.value = false
  }

  reader.readAsDataURL(file)
}

const clearImage = () => {
  spriteImage.value = null
  imageInfo.value = ''
  generatedGIF.value = null
  frames.value = []
  stopAnimation()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const applyPreset = (width, height) => {
  config.value.frameWidth = width
  config.value.frameHeight = height
  extractFrames()
}

const detectFromImage = async () => {
  if (!spriteImage.value) return

  const img = new Image()
  img.src = spriteImage.value

  await new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve()
    } else {
      img.onload = resolve
      img.onerror = () => resolve()
    }
  })

  const possibleSizes = [8, 16, 32, 64, 128]

  for (const size of possibleSizes) {
    if (img.width % size === 0 && img.height % size === 0) {
      const cols = img.width / size
      const rows = img.height / size

      if (cols >= 2 && cols <= 20 && rows >= 1 && rows <= 20) {
        config.value.frameWidth = size
        config.value.frameHeight = size
        return
      }
    }
  }
}

const onConfigChange = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    extractFrames()
  }, 300)
}

const extractFrames = async () => {
  if (!spriteImage.value) return

  // 参数校验
  if (config.value.frameWidth <= 0 || config.value.frameHeight <= 0) return

  const img = new Image()
  img.src = spriteImage.value

  await new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve()
    } else {
      img.onload = resolve
      img.onerror = () => resolve()
    }
  })

  const cols = Math.floor(img.width / config.value.frameWidth)
  const rows = Math.floor(img.height / config.value.frameHeight)

  // 校验有效帧数
  if (cols <= 0 || rows <= 0) return

  const totalFrames = config.value.maxFrames > 0
    ? Math.min(cols * rows, config.value.maxFrames)
    : cols * rows

  frames.value = []

  for (let row = 0; row < rows && frames.value.length < totalFrames; row++) {
    for (let col = 0; col < cols && frames.value.length < totalFrames; col++) {
      const canvas = document.createElement('canvas')
      canvas.width = config.value.frameWidth
      canvas.height = config.value.frameHeight
      const ctx = canvas.getContext('2d')

      const sx = col * config.value.frameWidth
      const sy = row * config.value.frameHeight

      ctx.drawImage(
        img,
        sx, sy, config.value.frameWidth, config.value.frameHeight,
        0, 0, config.value.frameWidth, config.value.frameHeight
      )

      frames.value.push(canvas.toDataURL('image/png'))
    }
  }

  updatePreview()
}

const updatePreview = async () => {
  if (!previewCanvas.value || frames.value.length === 0) return

  await nextTick()

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')

  const maxCols = Math.min(frames.value.length, 10)
  const previewRows = Math.ceil(frames.value.length / maxCols)
  const cellSize = 50

  canvas.width = maxCols * (cellSize + 5)
  canvas.height = previewRows * (cellSize + 5)

  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 预加载所有图片后再统一绘制
  const loadImage = (src) => new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

  const images = await Promise.all(frames.value.map(loadImage))

  images.forEach((img, index) => {
    if (!img) return
    const col = index % maxCols
    const row = Math.floor(index / maxCols)
    ctx.drawImage(img, col * (cellSize + 5), row * (cellSize + 5), cellSize, cellSize)
  })
}

const previewAnimation = () => {
  if (frames.value.length === 0) return

  if (isPlaying.value) {
    stopAnimation()
  } else {
    startAnimation()
  }
}

const startAnimation = () => {
  if (!animationCanvas.value || frames.value.length === 0) return

  isPlaying.value = true
  let currentFrame = 0

  const canvas = animationCanvas.value
  const ctx = canvas.getContext('2d')

  const animate = () => {
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      currentFrame = (currentFrame + 1) % frames.value.length
      animationInterval = setTimeout(animate, config.value.duration)
    }
    img.src = frames.value[currentFrame]
  }

  animate()
}

const stopAnimation = () => {
  isPlaying.value = false
  if (animationInterval) {
    clearTimeout(animationInterval)
    animationInterval = null
  }
}

const generateGIF = async () => {
  if (frames.value.length === 0 || isGenerating.value) return

  isGenerating.value = true

  try {
    const gifshot = await import('gifshot')

    const result = await new Promise((resolve, reject) => {
      gifshot.default.createGIF({
        images: frames.value,
        gifWidth: config.value.frameWidth,
        gifHeight: config.value.frameHeight,
        interval: config.value.duration / 1000,
        frameDuration: Math.round(config.value.duration / 10),
        sampleInterval: 10,
        numWorkers: 2,
      }, (obj) => {
        if (obj.error) {
          reject(new Error(obj.errorMsg || 'GIF 生成失败'))
        } else {
          resolve(obj)
        }
      })
    })

    generatedGIF.value = result.image

  } catch (error) {
    console.error('GIF生成失败:', error)
    alert('GIF 生成失败：' + error.message)
  } finally {
    isGenerating.value = false
  }
}

const downloadGIF = () => {
  if (!generatedGIF.value) return

  const link = document.createElement('a')
  link.download = 'sprite-animation.gif'
  link.href = generatedGIF.value
  link.click()
}

const saveToGallery = () => {
  if (!generatedGIF.value || !saveForm.value.title) {
    alert('请输入标题')
    return
  }

  const data = {
    title: saveForm.value.title,
    description: saveForm.value.description,
    category: categoryMap[saveForm.value.categoryId],
    categoryId: saveForm.value.categoryId,
    date: saveForm.value.date,
    type: 'image',
    image: generatedGIF.value
  }

  addGalleryItem(data)

  // 重置表单并关闭弹窗
  saveForm.value = {
    title: '',
    description: '',
    categoryId: 'detail',
    date: new Date().toISOString().split('T')[0]
  }
  showSaveModal.value = false

  alert('已保存到画廊！可以在"画廊"页面查看')
}

onUnmounted(() => {
  stopAnimation()
  clearTimeout(debounceTimer)
})
</script>

<style scoped>
.sprite-tool-page {
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
  position: relative;
  max-width: 100%;
}

.upload-preview img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.upload-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--浅青灰);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--霜蓝);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.clear-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #ef5350;
  transform: scale(1.1);
}

/* 配置区域 */
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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

.config-item .hint {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: 4px;
}

.config-input {
  padding: 12px 16px;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 1rem;
  background: white;
  color: var(--text-dark);
}

.preset-section {
  margin-bottom: 30px;
}

.preset-section h3 {
  font-size: 1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
  font-weight: 400;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-btn {
  padding: 10px 20px;
  background: var(--浅雾);
  border: 1px solid var(--霜蓝);
  border-radius: 20px;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.preset-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.preview-btn,
.generate-btn {
  flex: 1;
  min-width: 200px;
  padding: 15px 30px;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  letter-spacing: 0.15rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preview-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.preview-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.generate-btn {
  background: var(--浅青灰);
  color: var(--米白);
}

.generate-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 154, 157, 0.3);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 预览区域 */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.preview-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  text-align: center;
}

.preview-card h3 {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
  font-weight: 400;
}

.image-container {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--浅雾);
  border-radius: 10px;
  padding: 15px;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.preview-canvas {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--浅雾);
  border-radius: 10px;
}

.animation-canvas {
  border: 1px solid var(--浅雾);
  border-radius: 10px;
  background: var(--浅雾);
  margin: 0 auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.frames-preview {
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-info {
  margin-top: 15px;
  font-size: 0.85rem;
  color: var(--text-light);
}

.generated-gif {
  margin-top: 20px;
}

.generated-gif h4 {
  font-size: 1rem;
  color: var(--浅青灰);
  margin-bottom: 10px;
}

.generated-image {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin-bottom: 15px;
}

.download-btn,
.save-btn {
  padding: 10px 25px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.download-btn:hover,
.save-btn:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.save-btn {
  background: var(--霜蓝);
}

.save-btn:hover {
  background: var(--深霜蓝);
}

.gif-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
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
  color: var(--米白);
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

.save-form .modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.save-form .btn-cancel,
.save-form .btn-save {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
}

.save-form .btn-cancel {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.save-form .btn-save {
  background: var(--浅青灰);
  color: var(--米白);
}

.save-form .btn-cancel:hover {
  background: var(--霜蓝);
}

.save-form .btn-save:hover {
  background: var(--text-dark);
}

@media (max-width: 768px) {
  .page-title {
    letter-spacing: 0.3rem;
  }

  section {
    padding: 30px 20px;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
