<template>
  <div class="game-page">
    <div class="page-header">
      <h1 class="page-title">像素风横板游戏</h1>
      <p class="page-subtitle">使用 WASD 控制角色移动，探索像素世界</p>
      <div class="header-divider"></div>
    </div>

    <div class="game-container">
      <!-- 游戏控制栏 -->
      <section class="game-controls">
        <h2 class="section-title">游戏控制</h2>
        <div class="control-buttons">
          <button @click="startGame" class="start-btn" :disabled="isPlaying">
            {{ isPlaying ? '游戏中...' : '开始游戏' }}
          </button>
          <button @click="pauseGame" class="pause-btn" :disabled="!isPlaying">
            {{ isPaused ? '继续' : '暂停' }}
          </button>
          <button @click="resetGame" class="reset-btn">重置</button>
        </div>

        <div class="instructions">
          <h3>操作说明</h3>
          <div class="key-guide">
            <div class="key-row">
              <span class="key">W</span>
              <span class="key-desc">上移</span>
            </div>
            <div class="key-row">
              <span class="key">A</span>
              <span class="key">S</span>
              <span class="key">D</span>
              <span class="key-desc">左/下/右</span>
            </div>
          </div>
        </div>

        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">分数：</span>
            <span class="stat-value">{{ gameStats.score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">生命：</span>
            <span class="stat-value">{{ gameStats.lives }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">收集：</span>
            <span class="stat-value">{{ gameStats.collected }} / {{ gameStats.totalItems }}</span>
          </div>
        </div>
      </section>

      <!-- 游戏画布 -->
      <section class="game-section">
        <canvas
          ref="gameCanvas"
          class="game-canvas"
          :width="canvasWidth"
          :height="canvasHeight"
        ></canvas>

        <!-- 游戏结束弹窗 -->
        <div v-if="showGameOver" class="game-over-overlay">
          <div class="game-over-content">
            <h2>游戏结束</h2>
            <p class="final-score">最终分数：{{ gameStats.score }}</p>
            <button @click="restartGame" class="restart-btn">再玩一次</button>
          </div>
        </div>
      </section>

      <!-- 资源选择 -->
      <section class="resources-section">
        <h2 class="section-title">游戏资源</h2>
        <div class="resource-tabs">
          <button
            v-for="tab in resourceTabs"
            :key="tab.id"
            class="resource-tab"
            :class="{ active: activeResourceTab === tab.id }"
            @click="activeResourceTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>

        <div class="resource-content">
          <!-- 角色选择 -->
          <div v-if="activeResourceTab === 'characters'" class="resource-list">
            <div
              v-for="char in characters"
              :key="char.id"
              class="resource-item"
              :class="{ selected: selectedCharacter?.id === char.id }"
              @click="selectCharacter(char)"
            >
              <canvas
                :ref="el => char.previewRef = el"
                :width="64"
                :height="64"
                class="resource-preview"
              ></canvas>
              <span class="resource-name">{{ char.name }}</span>
            </div>
          </div>

          <!-- 场景选择 -->
          <div v-if="activeResourceTab === 'scenes'" class="resource-list">
            <div
              v-for="scene in scenes"
              :key="scene.id"
              class="resource-item"
              :class="{ selected: selectedScene?.id === scene.id }"
              @click="selectScene(scene)"
            >
              <div class="scene-preview" :style="{ background: scene.preview }"></div>
              <span class="resource-name">{{ scene.name }}</span>
            </div>
          </div>

          <!-- 道具选择 -->
          <div v-if="activeResourceTab === 'items'" class="resource-list">
            <div
              v-for="item in collectibleItems"
              :key="item.id"
              class="resource-item"
            >
              <canvas
                :ref="el => item.previewRef = el"
                :width="32"
                :height="32"
                class="resource-preview small"
              ></canvas>
              <span class="resource-name">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const gameCanvas = ref(null)
const isPlaying = ref(false)
const isPaused = ref(false)
const showGameOver = ref(false)

const canvasWidth = 800
const canvasHeight = 480

// 游戏统计
const gameStats = ref({
  score: 0,
  lives: 3,
  collected: 0,
  totalItems: 5
})

// 游戏状态
let gameLoopId = null
let ctx = null
let lastTime = 0

// 玩家角色
const player = ref({
  x: 100,
  y: 300,
  width: 32,
  height: 32,
  speed: 200,
  vx: 0,
  vy: 0,
  direction: 'right',
  frame: 0,
  frameTime: 0,
  frameDuration: 150
})

// 输入状态
const keys = {
  w: false,
  a: false,
  s: false,
  d: false
}

// 资源标签
const resourceTabs = [
  { id: 'characters', name: '角色' },
  { id: 'scenes', name: '场景' },
  { id: 'items', name: '道具' }
]

const activeResourceTab = ref('characters')
const selectedCharacter = ref(null)
const selectedScene = ref(null)

// 角色数据
const characters = ref([
  {
    id: 1,
    name: '冒险者',
    color: '#FF6B6B',
    // 简单像素风格角色绘制函数
    draw: (ctx, x, y, frame, direction) => {
      const w = 32
      const h = 32

      // 身体
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(x + 8, y + 12, 16, 14)

      // 头
      ctx.fillStyle = '#FFE66D'
      ctx.fillRect(x + 10, y + 2, 12, 10)

      // 眼睛
      ctx.fillStyle = '#333'
      ctx.fillRect(x + 12, y + 5, 3, 3)
      ctx.fillRect(x + 17, y + 5, 3, 3)

      // 腿
      ctx.fillStyle = '#4ECDC4'
      const legOffset = Math.sin(frame * 0.3) * 3
      ctx.fillRect(x + 10, y + 26 + legOffset, 5, 6)
      ctx.fillRect(x + 17, y + 26 - legOffset, 5, 6)

      // 手
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(x + 4, y + 16, 4, 8)
      ctx.fillRect(x + 24, y + 16, 4, 8)
    }
  },
  {
    id: 2,
    name: '魔法师',
    color: '#A8E6CF',
    draw: (ctx, x, y, frame, direction) => {
      const w = 32

      // 长袍
      ctx.fillStyle = '#A8E6CF'
      ctx.fillRect(x + 6, y + 10, 20, 18)

      // 帽子
      ctx.fillStyle = '#6BCF7F'
      ctx.fillRect(x + 8, y + 2, 16, 10)

      // 眼睛
      ctx.fillStyle = '#333'
      ctx.fillRect(x + 12, y + 5, 3, 3)
      ctx.fillRect(x + 17, y + 5, 3, 3)

      // 魔法效果
      const magicGlow = Math.sin(frame * 0.5) * 0.3 + 0.7
      ctx.fillStyle = `rgba(255, 230, 109, ${magicGlow})`
      ctx.beginPath()
      ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2)
      ctx.fill()
    }
  }
])

// 场景数据
const scenes = ref([
  {
    id: 1,
    name: '草地',
    preview: 'linear-gradient(135deg, #a8e6cf 0%, #88d8b0 100%)',
    backgroundColor: '#90EE90',
    groundColor: '#228B22'
  },
  {
    id: 2,
    name: '沙漠',
    preview: 'linear-gradient(135deg, #f5deb3 0%, #daa520 100%)',
    backgroundColor: '#FFE4B5',
    groundColor: '#D2691E'
  },
  {
    id: 3,
    name: '雪地',
    preview: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
    backgroundColor: '#F0FFFF',
    groundColor: '#E0FFFF'
  }
])

// 收集物品
const collectibleItems = ref([
  {
    id: 1,
    name: '金币',
    x: 200,
    y: 350,
    collected: false,
    draw: (ctx, x, y) => {
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.arc(x + 16, y + 16, 10, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFA500'
      ctx.beginPath()
      ctx.arc(x + 16, y + 16, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  },
  {
    id: 2,
    name: '宝石',
    x: 400,
    y: 300,
    collected: false,
    draw: (ctx, x, y) => {
      ctx.fillStyle = '#9B59B6'
      ctx.beginPath()
      ctx.moveTo(x + 16, y + 8)
      ctx.lineTo(x + 24, y + 16)
      ctx.lineTo(x + 16, y + 24)
      ctx.lineTo(x + 8, y + 16)
      ctx.closePath()
      ctx.fill()
    }
  },
  {
    id: 3,
    name: '星星',
    x: 600,
    y: 380,
    collected: false,
    draw: (ctx, x, y, frame) => {
      const scale = Math.sin(frame * 0.1) * 0.2 + 1
      ctx.save()
      ctx.translate(x + 16, y + 16)
      ctx.scale(scale, scale)
      ctx.fillStyle = '#FFEB3B'
      drawStar(ctx, 0, 0, 12, 5)
      ctx.restore()
    }
  },
  {
    id: 4,
    name: '钻石',
    x: 300,
    y: 280,
    collected: false,
    draw: (ctx, x, y) => {
      ctx.fillStyle = '#B9F2FF'
      ctx.beginPath()
      ctx.moveTo(x + 16, y + 4)
      ctx.lineTo(x + 20, y + 12)
      ctx.lineTo(x + 24, y + 20)
      ctx.lineTo(x + 20, y + 28)
      ctx.lineTo(x + 16, y + 36)
      ctx.lineTo(x + 12, y + 28)
      ctx.lineTo(x + 8, y + 20)
      ctx.lineTo(x + 12, y + 12)
      ctx.closePath()
      ctx.fill()
    }
  },
  {
    id: 5,
    name: '红心',
    x: 500,
    y: 320,
    collected: false,
    draw: (ctx, x, y, frame) => {
      const scale = Math.sin(frame * 0.15) * 0.1 + 1
      ctx.save()
      ctx.translate(x + 16, y + 16)
      ctx.scale(scale, scale)
      ctx.fillStyle = '#FF6B6B'
      ctx.beginPath()
      ctx.moveTo(0, -4)
      ctx.bezierCurveTo(-8, -8, -8, 4, 0, 8)
      ctx.bezierCurveTo(8, 4, 8, -8, 0, -4)
      ctx.fill()
      ctx.restore()
    }
  }
])

// 绘制星星辅助函数
function drawStar(ctx, cx, cy, spikes, outerRadius) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

// 游戏初始化
const initGame = () => {
  ctx = gameCanvas.value.getContext('2d')
  selectedCharacter.value = characters.value[0]
  selectedScene.value = scenes.value[0]

  // 绘制资源预览
  nextTick(() => {
    drawResourcePreviews()
  })
}

// 绘制资源预览
const drawResourcePreviews = () => {
  // 绘制角色预览
  characters.value.forEach(char => {
    if (char.previewRef) {
      const previewCtx = char.previewRef.getContext('2d')
      previewCtx.clearRect(0, 0, 64, 64)

      // 绘制棋盘格背景
      drawCheckerboard(previewCtx, 64, 64)

      char.draw(previewCtx, 0, 0, 0, 'right')
    }
  })

  // 绘制物品预览
  collectibleItems.value.forEach(item => {
    if (item.previewRef) {
      const previewCtx = item.previewRef.getContext('2d')
      previewCtx.clearRect(0, 0, 32, 32)

      drawCheckerboard(previewCtx, 32, 32)
      item.draw(previewCtx, 0, 0, 0)
    }
  })
}

// 绘制棋盘格背景
const drawCheckerboard = (ctx, width, height) => {
  const checkerSize = 8
  const color1 = '#ffffff'
  const color2 = '#f0f0f0'

  for (let y = 0; y < height; y += checkerSize) {
    for (let x = 0; x < width; x += checkerSize) {
      const useColor1 = ((Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2) === 0
      ctx.fillStyle = useColor1 ? color1 : color2
      ctx.fillRect(x, y, checkerSize, checkerSize)
    }
  }
}

// 绘制游戏场景
const drawScene = () => {
  if (!ctx || !selectedScene.value) return

  // 清空画布
  ctx.fillStyle = selectedScene.value.backgroundColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制地面
  ctx.fillStyle = selectedScene.value.groundColor
  ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100)

  // 绘制一些装饰
  drawDecorations()
}

// 绘制装饰
const drawDecorations = () => {
  // 绘制云朵
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  drawCloud(100, 60)
  drawCloud(400, 80)
  drawCloud(650, 50)

  // 绘制草丛
  ctx.fillStyle = '#32CD32'
  drawGrass(150, canvasHeight - 100)
  drawGrass(300, canvasHeight - 100)
  drawGrass(500, canvasHeight - 100)
  drawGrass(700, canvasHeight - 100)
}

const drawCloud = (x, y) => {
  ctx.beginPath()
  ctx.arc(x, y, 20, 0, Math.PI * 2)
  ctx.arc(x + 25, y - 5, 25, 0, Math.PI * 2)
  ctx.arc(x + 50, y, 20, 0, Math.PI * 2)
  ctx.fill()
}

const drawGrass = (x, y) => {
  ctx.fillRect(x, y - 15, 3, 15)
  ctx.fillRect(x + 5, y - 18, 3, 18)
  ctx.fillRect(x + 10, y - 12, 3, 12)
}

// 绘制玩家
const drawPlayer = () => {
  if (!ctx || !selectedCharacter.value) return
  selectedCharacter.value.draw(
    ctx,
    player.value.x,
    player.value.y,
    player.value.frame,
    player.value.direction
  )
}

// 绘制收集物品
const drawCollectibles = (currentTime) => {
  collectibleItems.value.forEach(item => {
    if (!item.collected) {
      item.draw(ctx, item.x, item.y, Math.floor(currentTime / 100))
    }
  })
}

// 更新游戏逻辑
const update = (deltaTime) => {
  const dt = deltaTime / 1000

  // 更新玩家位置
  updatePlayer(dt)

  // 更新动画帧
  player.value.frameTime += deltaTime
  if (player.value.frameTime >= player.value.frameDuration) {
    player.value.frame = (player.value.frame + 1) % 4
    player.value.frameTime = 0
  }

  // 检测收集
  checkCollisions()
}

// 更新玩家
const updatePlayer = (dt) => {
  const p = player.value
  let dx = 0
  let dy = 0

  // 处理输入
  if (keys.w) dy -= 1
  if (keys.s) dy += 1
  if (keys.a) dx -= 1
  if (keys.d) dx += 1

  // 归一化对角线移动
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707
    dy *= 0.707
  }

  // 更新速度
  p.vx = dx * p.speed
  p.vy = dy * p.speed

  // 更新位置
  p.x += p.vx * dt
  p.y += p.vy * dt

  // 更新朝向
  if (dx < 0) p.direction = 'left'
  if (dx > 0) p.direction = 'right'

  // 边界检测
  p.x = Math.max(0, Math.min(canvasWidth - p.width, p.x))
  p.y = Math.max(0, Math.min(canvasHeight - 100 - p.height, p.y))
}

// 碰撞检测
const checkCollisions = () => {
  const p = player.value

  collectibleItems.value.forEach(item => {
    if (item.collected) return

    // 简单的矩形碰撞检测
    if (
      p.x < item.x + 32 &&
      p.x + p.width > item.x &&
      p.y < item.y + 32 &&
      p.y + p.height > item.y
    ) {
      item.collected = true
      gameStats.value.score += 100
      gameStats.value.collected += 1

      // 检查游戏结束
      if (gameStats.value.collected >= gameStats.value.totalItems) {
        endGame()
      }
    }
  })
}

// 游戏循环
const gameLoop = (currentTime) => {
  if (!isPlaying.value || isPaused.value) {
    lastTime = currentTime
    return
  }

  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  // 更新逻辑
  update(deltaTime)

  // 绘制场景
  drawScene()

  // 绘制收集物品
  drawCollectibles(currentTime)

  // 绘制玩家
  drawPlayer()

  // 绘制UI
  drawUI()

  gameLoopId = requestAnimationFrame(gameLoop)
}

// 绘制UI
const drawUI = () => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(10, 10, 150, 60)

  ctx.fillStyle = 'white'
  ctx.font = 'bold 14px Arial'
  ctx.fillText(`分数: ${gameStats.value.score}`, 20, 30)
  ctx.fillText(`生命: ${gameStats.value.lives}`, 20, 50)
}

// 输入处理
const handleKeyDown = (e) => {
  const key = e.key.toLowerCase()
  if (keys.hasOwnProperty(key)) {
    keys[key] = true
    e.preventDefault()
  }
}

const handleKeyUp = (e) => {
  const key = e.key.toLowerCase()
  if (keys.hasOwnProperty(key)) {
    keys[key] = false
    e.preventDefault()
  }
}

// 游戏控制
const startGame = () => {
  if (isPlaying.value) return

  resetGame()
  isPlaying.value = true
  isPaused.value = false
  showGameOver.value = false
  lastTime = performance.now()
  gameLoopId = requestAnimationFrame(gameLoop)
}

const pauseGame = () => {
  isPaused.value = !isPaused.value
}

const resetGame = () => {
  isPlaying.value = false
  isPaused.value = false
  showGameOver.value = false

  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId)
  }

  // 重置玩家
  player.value = {
    ...player.value,
    x: 100,
    y: 300,
    frame: 0,
    frameTime: 0
  }

  // 重置物品
  collectibleItems.value.forEach(item => {
    item.collected = false
  })

  // 重置统计
  gameStats.value = {
    score: 0,
    lives: 3,
    collected: 0,
    totalItems: 5
  }

  // 初始绘制
  if (ctx) {
    drawScene()
    drawCollectibles(0)
    drawPlayer()
  }
}

const restartGame = () => {
  resetGame()
  startGame()
}

const endGame = () => {
  isPlaying.value = false
  showGameOver.value = true
}

// 资源选择
const selectCharacter = (char) => {
  selectedCharacter.value = char
  drawResourcePreviews()
  if (!isPlaying.value && ctx) {
    drawScene()
    drawPlayer()
  }
}

const selectScene = (scene) => {
  selectedScene.value = scene
  if (!isPlaying.value && ctx) {
    drawScene()
    drawCollectibles(0)
    drawPlayer()
  }
}

// 生命周期
onMounted(() => {
  initGame()
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId)
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style scoped>
.game-page {
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

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.section-title {
  font-size: 1.3rem;
  color: var(--浅青灰);
  margin-bottom: 20px;
  font-weight: 400;
}

/* 游戏控制 */
.control-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.start-btn,
.pause-btn,
.reset-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 15px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn {
  background: var(--浅青灰);
  color: var(--米白);
}

.start-btn:hover:not(:disabled) {
  background: var(--text-dark);
  transform: translateY(-2px);
}

.pause-btn {
  background: var(--霜蓝);
  color: var(--米白);
}

.reset-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.start-btn:disabled,
.pause-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 操作说明 */
.instructions {
  margin-bottom: 25px;
}

.instructions h3 {
  font-size: 1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.key-guide {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 2px solid var(--浅青灰);
  border-radius: 8px;
  font-weight: bold;
  color: var(--浅青灰);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.key-desc {
  font-size: 0.9rem;
  color: var(--text-light);
}

/* 游戏统计 */
.game-stats {
  display: flex;
  gap: 25px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-light);
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--浅青灰);
}

/* 游戏画布 */
.game-section {
  position: relative;
}

.game-canvas {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 15px;
  border: 3px solid var(--霜蓝);
  background: #f0f0f0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* 游戏结束 */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
}

.game-over-content {
  background: var(--柔白);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
}

.game-over-content h2 {
  font-size: 2rem;
  color: var(--浅青灰);
  margin-bottom: 20px;
}

.final-score {
  font-size: 1.2rem;
  color: var(--深霜蓝);
  margin-bottom: 25px;
}

.restart-btn {
  padding: 12px 30px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 15px;
  font-size: 1rem;
  cursor: pointer;
}

/* 资源选择 */
.resource-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--浅雾);
}

.resource-tab {
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
}

.resource-tab.active {
  color: var(--深霜蓝);
  border-bottom-color: var(--深霜蓝);
}

.resource-content {
  padding: 15px 0;
}

.resource-list {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 15px;
  background: var(--浅雾);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.resource-item:hover,
.resource-item.selected {
  background: var(--霜蓝);
  transform: translateY(-3px);
}

.resource-preview {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.resource-preview.small {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.scene-preview {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.resource-name {
  font-size: 0.85rem;
  color: var(--浅青灰);
  font-weight: 500;
}

@media (max-width: 768px) {
  .game-stats {
    flex-wrap: wrap;
    gap: 15px;
  }

  .control-buttons {
    flex-direction: column;
  }

  .resource-list {
    justify-content: center;
  }
}
</style>
