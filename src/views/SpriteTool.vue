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
            <span class="upload-hint">支持 PNG、GIF 等格式</span>
          </div>
          <div v-else class="upload-preview">
            <img :src="spriteImage" />
            <button @click.stop="clearImage" class="clear-btn">×</button>
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
              @input="updatePreview"
            />
          </div>

          <div class="config-item">
            <label>单帧高度 (px)</label>
            <input
              v-model.number="config.frameHeight"
              type="number"
              min="1"
              class="config-input"
              @input="updatePreview"
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
              @input="updatePreview"
            />
            <span class="hint">当前: {{ frames.length }} 帧</span>
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
            <canvas ref="animationCanvas" class="animation-canvas" :width="config.frameWidth" :height="config.frameHeight"></canvas>
            <div v-if="generatedGIF" class="generated-gif">
              <h4>生成的 GIF</h4>
              <img :src="generatedGIF" class="generated-image" />
              <button @click="downloadGIF" class="download-btn">下载 GIF</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const fileInput = ref(null)
const spriteImage = ref(null)
const imageInfo = ref('')
const generatedGIF = ref(null)
const isGenerating = ref(false)
const isDragOver = ref(false)
const isPlaying = ref(false)
const previewCanvas = ref(null)
const animationCanvas = ref(null)

let animationInterval = null

const config = ref({
  frameWidth: 32,
  frameHeight: 32,
  duration: 100,
  maxFrames: 0
})

const frames = ref([])

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
  const reader = new FileReader()
  reader.onload = (e) => {
    spriteImage.value = e.target.result

    const img = new Image()
    img.onload = () => {
      imageInfo.value = `${img.width} × ${img.height} px`
      detectFromImage()
      extractFrames()
    }
    img.src = e.target.result
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
  updatePreview()
}

const detectFromImage = () => {
  if (!spriteImage.value) return

  const img = new Image()
  img.src = spriteImage.value

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

const extractFrames = async () => {
  if (!spriteImage.value) return

  const img = new Image()
  img.src = spriteImage.value

  await new Promise(resolve => {
    img.onload = resolve
    if (img.complete) resolve()
  })

  const cols = Math.floor(img.width / config.value.frameWidth)
  const rows = Math.floor(img.height / config.value.frameHeight)
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

  frames.value.forEach((frameData, index) => {
    const col = index % maxCols
    const row = Math.floor(index / maxCols)

    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, col * (cellSize + 5), row * (cellSize + 5), cellSize, cellSize)
    }
    img.src = frameData
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
    // 使用 gifshot 库生成 GIF
    const gifshot = await import('gifshot')

    const result = await new Promise((resolve, reject) => {
      gifshot.default({
        images: frames.value,
        gifWidth: config.value.frameWidth,
        gifHeight: config.value.frameHeight,
        interval: config.value.duration / 10,
        numFrames: frames.value.length,
        frameDuration: config.value.duration / 10,
        sampleInterval: 10,
        numWorkers: 2,
      }, (error, result) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
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

onUnmounted(() => {
  stopAnimation()
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

.download-btn {
  padding: 10px 25px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
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
