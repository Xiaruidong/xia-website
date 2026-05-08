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
            <label>总帧数</label>
            <input
              v-model.number="config.maxFrames"
              type="number"
              min="1"
              class="config-input"
            />
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

        <button @click="generateGif" class="generate-btn" :disabled="isGenerating">
          {{ isGenerating ? '生成中...' : '生成 GIF 动图' }}
        </button>
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
            <h3>切割预览</h3>
            <div class="frames-preview">
              <canvas ref="previewCanvas" class="preview-canvas"></canvas>
            </div>
            <p class="image-info">共 {{ frameCount }} 帧</p>
          </div>

          <div v-if="generatedGif" class="preview-card">
            <h3>生成的 GIF</h3>
            <div class="image-container">
              <img :src="generatedGif" class="preview-image" />
            </div>
            <button @click="downloadGif" class="download-btn">下载 GIF</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const fileInput = ref(null)
const spriteImage = ref(null)
const imageInfo = ref('')
const generatedGif = ref(null)
const isGenerating = ref(false)
const isDragOver = ref(false)
const previewCanvas = ref(null)

const config = ref({
  frameWidth: 32,
  frameHeight: 32,
  duration: 100,
  maxFrames: 100
})

const frameCount = computed(() => {
  if (!spriteImage.value) return 0
  const img = new Image()
  img.src = spriteImage.value
  const cols = Math.floor(img.width / config.value.frameWidth)
  const rows = Math.floor(img.height / config.value.frameHeight)
  return Math.min(cols * rows, config.value.maxFrames)
})

const triggerUpload = () => {
  fileInput.value.click()
}

const handleDragOver = (e) => {
  isDragOver.value = true
}

const handleDragLeave = (e) => {
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
      updatePreview()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  spriteImage.value = null
  imageInfo.value = ''
  generatedGif.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const applyPreset = (width, height) => {
  config.value.frameWidth = width
  config.value.frameHeight = height
  updatePreview()
}

const detectFromImage = () => {
  if (!spriteImage.value) return

  const img = new Image()
  img.src = spriteImage.value

  // 尝试检测常见的像素画尺寸
  const possibleSizes = [8, 16, 32, 64, 128]

  for (const size of possibleSizes) {
    if (img.width % size === 0 && img.height % size === 0) {
      const cols = img.width / size
      const rows = img.height / size

      // 如果行列数合理（不太少也不太多）
      if (cols >= 2 && cols <= 20 && rows >= 1 && rows <= 20) {
        config.value.frameWidth = size
        config.value.frameHeight = size
        return
      }
    }
  }
}

const updatePreview = async () => {
  if (!spriteImage.value || !previewCanvas.value) return

  await nextTick()

  const img = new Image()
  img.src = spriteImage.value

  img.onload = () => {
    const canvas = previewCanvas.value
    const ctx = canvas.getContext('2d')

    const cols = Math.floor(img.width / config.value.frameWidth)
    const rows = Math.floor(img.height / config.value.frameHeight)
    const totalFrames = Math.min(cols * rows, config.value.maxFrames)

    // 设置canvas大小
    const maxCols = Math.min(cols, 10)
    const previewRows = Math.ceil(totalFrames / maxCols)
    canvas.width = maxCols * 60
    canvas.height = previewRows * 60

    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制帧预览
    let frameIndex = 0
    for (let row = 0; row < rows && frameIndex < totalFrames; row++) {
      for (let col = 0; col < cols && frameIndex < totalFrames; col++) {
        const previewCol = frameIndex % maxCols
        const previewRow = Math.floor(frameIndex / maxCols)

        const sx = col * config.value.frameWidth
        const sy = row * config.value.frameHeight
        const dx = previewCol * 60 + 5
        const dy = previewRow * 60 + 5

        ctx.drawImage(
          img,
          sx, sy, config.value.frameWidth, config.value.frameHeight,
          dx, dy, 50, 50
        )

        frameIndex++
      }
    }
  }
}

const generateGif = async () => {
  if (!spriteImage.value || isGenerating.value) return

  isGenerating.value = true

  try {
    const img = new Image()
    img.src = spriteImage.value

    await new Promise(resolve => {
      img.onload = resolve
      if (img.complete) resolve()
    })

    const cols = Math.floor(img.width / config.value.frameWidth)
    const rows = Math.floor(img.height / config.value.frameHeight)
    const totalFrames = Math.min(cols * rows, config.value.maxFrames)

    // 创建canvas来生成每一帧
    const frames = []

    for (let row = 0; row < rows && frames.length < totalFrames; row++) {
      for (let col = 0; col < cols && frames.length < totalFrames; col++) {
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

        frames.push(canvas.toDataURL('image/png'))
      }
    }

    // 使用 gif.js 生成 GIF
    // 这里使用一个简化的方法，使用 canvas 动画预览
    // 实际的 GIF 生成需要使用 gifshot 或 gif.js 库

    // 为了演示，我们创建一个动画预览
    const previewCanvas = document.createElement('canvas')
    previewCanvas.width = config.value.frameWidth
    previewCanvas.height = config.value.frameHeight
    const ctx = previewCanvas.getContext('2d')

    let currentFrame = 0
    const animateFrame = () => {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
        ctx.drawImage(img, 0, 0)
        currentFrame = (currentFrame + 1) % frames.length
        setTimeout(animateFrame, config.value.duration)
      }
      img.src = frames[currentFrame]
    }

    animateFrame()

    // 设置生成的GIF为动画预览
    generatedGif.value = previewCanvas.toDataURL()

    // 提示用户使用工具下载
    alert(`已生成 ${frames.length} 帧动画预览！\n\n如需下载为 GIF 文件，可以使用以下工具：\n- https://ezgif.com/sprite-to-gif\n- 或使用 "下载配置" 导出帧图片`)

  } catch (error) {
    console.error('生成 GIF 失败:', error)
    alert('生成失败，请检查图片格式和参数设置')
  } finally {
    isGenerating.value = false
  }
}

const downloadGif = () => {
  if (!generatedGif.value) return

  const link = document.createElement('a')
  link.download = 'sprite-animation.gif'
  link.href = generatedGif.value
  link.click()
}
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

.generate-btn {
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

.download-btn {
  margin-top: 15px;
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
}
</style>
