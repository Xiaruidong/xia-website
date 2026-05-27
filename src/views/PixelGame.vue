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
            <div class="key-row">
              <span class="key skill-key">J</span>
              <span class="key-desc">释放技能（根据朝向自动选择方向）</span>
            </div>
          </div>
          <div class="skill-hint">
            💡 技能：按J释放技能动画，根据朝向显示不同效果（替换角色动画）
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
                :width="96"
                :height="144"
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

const canvasWidth = 1200
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
  width: 96,
  height: 144,
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
  d: false,
  j: false
}

// 资源标签
const resourceTabs = [
  { id: 'characters', name: '角色' },
  { id: 'scenes', name: '场景' }
]

const activeResourceTab = ref('characters')
const selectedCharacter = ref(null)
const selectedScene = ref(null)

// 精灵图角色
const spriteWalkImage = ref(null)
const spriteWalkImgObj = ref(null)

// 技能精灵图
const skillSpriteImage = ref('/xia-website/role_skill1.png')
const skillSpriteImgObj = ref(null)
const skillFrameWidth = ref(32)
const skillFrameHeight = ref(32)
const skillTotalCols = ref(4)
const skillTotalRows = ref(4)

// 技能系统
const skills = ref([])
let skillIdCounter = 0

// NPC系统
const npcImage = ref('/xia-website/yuan_transparent.png')
const npcImgObj = ref(null)
const npcFrameWidth = ref(32)
const npcFrameHeight = ref(32)
const npcTotalCols = ref(5)
const npcTotalRows = ref(4)
const npcs = ref([
  {
    id: 1,
    name: 'NPC小圆',
    x: 400,
    y: 320,
    width: 96,
    height: 144,
    direction: 'down',
    frame: 0,
    frameTime: 0,
    frameDuration: 200
  }
])

// 角色数据
const characters = ref([
  {
    id: 1,
    name: '精灵图角色',
    color: '#FF6B6B',
    // 使用精灵图绘制角色
    draw: (ctx, x, y, frame, direction) => {
      if (!spriteWalkImgObj.value) {
        // 如果图片还没加载，显示占位符
        ctx.fillStyle = '#FF6B6B'
        ctx.fillRect(x, y, 96, 144)
        ctx.fillStyle = '#FFF'
        ctx.font = '10px Arial'
        ctx.fillText('加载中...', x + 2, y + 72)
        return
      }

      // 精灵图信息：128x193，4x4网格，每帧32x48
      const frameWidth = 32
      const frameHeight = 48
      const totalCols = 4
      const scale = 3 // 放大3倍

      // 根据方向选择起始帧
      // 第1列：向下(0,1,2,3)，第2列：向左(4,5,6,7)，第3列：向右(8,9,10,11)，第4列：向上(12,13,14,15)
      let startFrame = 0
      switch (direction) {
        case 'down':
          startFrame = 0
          break
        case 'left':
          startFrame = 4
          break
        case 'right':
          startFrame = 8
          break
        case 'up':
          startFrame = 12
          break
        default:
          startFrame = 0
      }

      // 计算当前动画帧（0-3循环）
      const currentAnimFrame = frame % 4
      const spriteIndex = startFrame + currentAnimFrame

      // 计算在精灵图中的位置
      const spriteCol = spriteIndex % totalCols
      const spriteRow = Math.floor(spriteIndex / totalCols)

      const srcX = spriteCol * frameWidth
      const srcY = spriteRow * frameHeight

      // 绘制精灵图帧（放大3倍）
      ctx.imageSmoothingEnabled = false // 保持像素风格
      ctx.drawImage(
        spriteWalkImgObj.value,
        srcX, srcY, frameWidth, frameHeight,
        x, y, frameWidth * scale, frameHeight * scale
      )
    }
  },
  {
    id: 2,
    name: '冒险者',
    color: '#FF6B6B',
    // 简单像素风格角色绘制函数
    draw: (ctx, x, y, frame, direction) => {
      const scale = 3
      const w = 32 * scale
      const h = 48 * scale

      // 身体
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(x + 8 * scale, y + 12 * scale, 16 * scale, 14 * scale)

      // 头
      ctx.fillStyle = '#FFE66D'
      ctx.fillRect(x + 10 * scale, y + 2 * scale, 12 * scale, 10 * scale)

      // 眼睛
      ctx.fillStyle = '#333'
      ctx.fillRect(x + 12 * scale, y + 5 * scale, 3 * scale, 3 * scale)
      ctx.fillRect(x + 17 * scale, y + 5 * scale, 3 * scale, 3 * scale)

      // 腿
      ctx.fillStyle = '#4ECDC4'
      const legOffset = Math.sin(frame * 0.3) * 3 * scale
      ctx.fillRect(x + 10 * scale, y + 26 * scale + legOffset, 5 * scale, 6 * scale)
      ctx.fillRect(x + 17 * scale, y + 26 * scale - legOffset, 5 * scale, 6 * scale)

      // 手
      ctx.fillStyle = '#FF6B6B'
      ctx.fillRect(x + 4 * scale, y + 16 * scale, 4 * scale, 8 * scale)
      ctx.fillRect(x + 24 * scale, y + 16 * scale, 4 * scale, 8 * scale)
    }
  },
  {
    id: 3,
    name: '魔法师',
    color: '#A8E6CF',
    draw: (ctx, x, y, frame, direction) => {
      const scale = 3
      const w = 32 * scale
      const h = 48 * scale

      // 长袍
      ctx.fillStyle = '#A8E6CF'
      ctx.fillRect(x + 6 * scale, y + 10 * scale, 20 * scale, 30 * scale)

      // 帽子
      ctx.fillStyle = '#6BCF7F'
      ctx.fillRect(x + 8 * scale, y + 2 * scale, 16 * scale, 10 * scale)

      // 眼睛
      ctx.fillStyle = '#333'
      ctx.fillRect(x + 12 * scale, y + 5 * scale, 3 * scale, 3 * scale)
      ctx.fillRect(x + 17 * scale, y + 5 * scale, 3 * scale, 3 * scale)

      // 魔法效果
      const magicGlow = Math.sin(frame * 0.5) * 0.3 + 0.7
      ctx.fillStyle = `rgba(255, 230, 109, ${magicGlow})`
      ctx.beginPath()
      ctx.arc(x + 16 * scale, y + 24 * scale, 8 * scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }
])

// 场景数据
// 自定义背景图片
const customBackgroundImage = ref(null)
const customBackgroundImgObj = ref(null) // 预加载的图片对象

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
  },
  {
    id: 4,
    name: '🖼️ 自定义背景图',
    preview: 'url(/xia-website/background.png) center/cover',
    backgroundColor: '#87CEEB',
    groundColor: '#228B22',
    isCustom: true,
    backgroundImage: '/xia-website/background.png'
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
    x: 450,
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
    x: 700,
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
    x: 350,
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
    x: 900,
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
const initGame = async () => {
  ctx = gameCanvas.value.getContext('2d')
  selectedCharacter.value = characters.value[0]
  selectedScene.value = scenes.value[0]

  // 预加载精灵图
  await loadSpriteWalkImage()
  await loadSkillSpriteImage()
  await loadNpcImage()

  // 绘制资源预览
  nextTick(() => {
    drawResourcePreviews()
  })
}

// 预加载精灵图
const loadSpriteWalkImage = async () => {
  const img = new Image()
  spriteWalkImage.value = '/xia-website/role_walk.png'

  await new Promise((resolve) => {
    img.onload = () => {
      console.log('精灵图加载成功')
      spriteWalkImgObj.value = img
      resolve()
    }
    img.onerror = (e) => {
      console.error('精灵图加载失败:', spriteWalkImage.value, e)
      spriteWalkImgObj.value = null
      resolve()
    }
    img.src = spriteWalkImage.value
  })
}

// 预加载技能精灵图
const loadSkillSpriteImage = async () => {
  const img = new Image()

  await new Promise((resolve) => {
    img.onload = () => {
      console.log('技能精灵图加载成功，尺寸:', img.width, 'x', img.height)

      // 自动计算帧尺寸
      skillTotalCols.value = 4
      skillTotalRows.value = 4
      skillFrameWidth.value = img.width / skillTotalCols.value
      skillFrameHeight.value = img.height / skillTotalRows.value

      console.log('每帧尺寸:', skillFrameWidth.value, 'x', skillFrameHeight.value)
      skillSpriteImgObj.value = img
      resolve()
    }
    img.onerror = (e) => {
      console.error('技能精灵图加载失败:', skillSpriteImage.value, e)
      skillSpriteImgObj.value = null
      resolve()
    }
    img.src = skillSpriteImage.value
  })
}

const loadNpcImage = async () => {
  const img = new Image()

  await new Promise((resolve) => {
    img.onload = () => {
      console.log('NPC图片加载成功，尺寸:', img.width, 'x', img.height)

      // 自动计算帧尺寸
      npcTotalCols.value = 5
      npcTotalRows.value = 4
      npcFrameWidth.value = img.width / npcTotalCols.value
      npcFrameHeight.value = img.height / npcTotalRows.value

      console.log('NPC每帧尺寸:', npcFrameWidth.value, 'x', npcFrameHeight.value)
      npcImgObj.value = img
      resolve()
    }
    img.onerror = (e) => {
      console.error('NPC图片加载失败:', npcImage.value, e)
      npcImgObj.value = null
      resolve()
    }
    img.src = npcImage.value
  })
}

// 绘制资源预览
const drawResourcePreviews = () => {
  // 绘制角色预览
  characters.value.forEach(char => {
    if (char.previewRef) {
      const previewCtx = char.previewRef.getContext('2d')
      previewCtx.clearRect(0, 0, 96, 144)

      // 绘制棋盘格背景
      drawCheckerboard(previewCtx, 96, 144)

      // 在预览中绘制缩小的角色（居中显示）
      previewCtx.save()
      previewCtx.scale(0.33, 0.33) // 缩小到约1/3以适应预览框
      previewCtx.translate(0, 0)
      char.draw(previewCtx, 0, 0, 0, 'down')
      previewCtx.restore()
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

  // 如果是自定义背景且有预加载的图片
  if (selectedScene.value.isCustom && customBackgroundImgObj.value) {
    // 使用 cover 模式绘制背景（保持宽高比，裁剪多余部分）
    drawImageCover(ctx, customBackgroundImgObj.value, 0, 0, canvasWidth, canvasHeight)
  } else if (selectedScene.value.isCustom && customBackgroundImage.value) {
    // 尝试异步加载背景图片
    const img = new Image()
    // 不设置 crossOrigin，避免 CORS 问题
    img.onload = () => {
      console.log('背景图片加载成功')
      customBackgroundImgObj.value = img
      drawImageCover(ctx, img, 0, 0, canvasWidth, canvasHeight)
    }
    img.onerror = (e) => {
      console.error('背景图片加载失败:', customBackgroundImage.value, e)
      // 失败时使用默认背景
      ctx.fillStyle = selectedScene.value.backgroundColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      // 绘制地面
      ctx.fillStyle = selectedScene.value.groundColor
      ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100)
    }
    img.src = customBackgroundImage.value
    return
  } else {
    // 清空画布
    ctx.fillStyle = selectedScene.value.backgroundColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 绘制地面
    ctx.fillStyle = selectedScene.value.groundColor
    ctx.fillRect(0, canvasHeight - 100, canvasWidth, 100)
  }
}

// 使用 cover 模式绘制图片（保持宽高比，裁剪多余部分）
const drawImageCover = (ctx, img, x, y, w, h) => {
  const imgRatio = img.width / img.height
  const canvasRatio = w / h

  let drawWidth, drawHeight, offsetX, offsetY

  if (imgRatio > canvasRatio) {
    // 图片更宽，裁剪左右
    drawHeight = h
    drawWidth = h * imgRatio
    offsetX = x - (drawWidth - w) / 2
    offsetY = y
  } else {
    // 图片更高，裁剪上下
    drawWidth = w
    drawHeight = w / imgRatio
    offsetX = x
    offsetY = y - (drawHeight - h) / 2
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
}

// 绘制玩家
const drawPlayer = () => {
  if (!ctx || !selectedCharacter.value) return

  // 如果有技能正在播放，绘制技能动画而不是角色
  if (skills.value.length > 0 && skillSpriteImgObj.value) {
    drawActiveSkill()
    return
  }

  selectedCharacter.value.draw(
    ctx,
    player.value.x,
    player.value.y,
    player.value.frame,
    player.value.direction
  )
}

// 绘制NPC
const drawNpcs = () => {
  if (!npcImgObj.value) {
    return
  }

  npcs.value.forEach(npc => {
    // 根据方向选择起始行（假设与角色相同：0=向下, 1=向左, 2=向右, 3=向上）
    let startRow = 0
    switch (npc.direction) {
      case 'down': startRow = 0; break
      case 'left': startRow = 1; break
      case 'right': startRow = 2; break
      case 'up': startRow = 3; break
      default: startRow = 0
    }

    // 计算当前帧在精灵图中的位置
    const spriteCol = npc.frame % npcTotalCols.value
    const spriteRow = startRow

    const srcX = spriteCol * npcFrameWidth.value
    const srcY = spriteRow * npcFrameHeight.value

    // 绘制NPC精灵图帧
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      npcImgObj.value,
      srcX, srcY, npcFrameWidth.value, npcFrameHeight.value,
      npc.x, npc.y, npc.width, npc.height
    )
  })
}

// 释放技能
const releaseSkill = () => {
  if (!skillSpriteImgObj.value) {
    console.log('技能精灵图未加载')
    return
  }

  // 根据玩家朝向选择起始帧（与行走图一致）
  // 第1列：向下(0-3)，第2列：向左(4-7)，第3列：向右(8-11)，第4列：向上(12-15)
  let startFrame = 0
  switch (player.value.direction) {
    case 'down':
      startFrame = 0
      break
    case 'left':
      startFrame = 4
      break
    case 'right':
      startFrame = 8
      break
    case 'up':
      startFrame = 12
      break
    default:
      startFrame = 0
  }

  // 创建技能对象（位置现在在drawActiveSkill中动态计算）
  const skill = {
    id: ++skillIdCounter,
    direction: player.value.direction,
    currentFrame: 0,
    frameTime: 0,
    frameDuration: 100, // 每帧100ms
    totalFrames: 4,
    startFrame: startFrame
  }

  skills.value.push(skill)

  console.log('释放技能，朝向:', player.value.direction, '起始帧:', startFrame)
}

// 绘制技能
const drawSkills = () => {
  // 不再使用此函数，技能动画现在在drawActiveSkill中处理
}

// 绘制激活的技能（替换角色动画）
const drawActiveSkill = () => {
  if (skills.value.length === 0 || !skillSpriteImgObj.value) return

  // 获取最新的技能
  const skill = skills.value[0]

  // 更新技能动画
  skill.frameTime += 16 // 约60fps
  if (skill.frameTime >= skill.frameDuration) {
    skill.currentFrame = (skill.currentFrame + 1) % skill.totalFrames
    skill.frameTime = 0
  }

  // 如果动画播放完毕（回到第0帧），移除技能
  if (skill.currentFrame === 0 && skill.frameTime === 0 && skill.totalFrames > 0) {
    skills.value.shift() // 移除第一个技能
    return
  }

  // 计算当前帧在精灵图中的位置
  const totalCols = skillTotalCols.value
  const spriteIndex = skill.startFrame + skill.currentFrame
  const spriteCol = spriteIndex % totalCols
  const spriteRow = Math.floor(spriteIndex / totalCols)

  const srcX = spriteCol * skillFrameWidth.value
  const srcY = spriteRow * skillFrameHeight.value

  // 技能大小与角色保持一致（96x144）
  const skillWidth = player.value.width
  const skillHeight = player.value.height

  // 绘制位置：与角色位置完全一致
  const drawX = player.value.x
  const drawY = player.value.y

  // 绘制技能动画（拉伸到角色尺寸）
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    skillSpriteImgObj.value,
    srcX, srcY, skillFrameWidth.value, skillFrameHeight.value,
    drawX, drawY, skillWidth, skillHeight
  )
}
// 更新游戏逻辑
const update = (deltaTime) => {
  const dt = deltaTime / 1000

  // 更新玩家位置
  updatePlayer(dt)

  // 更新玩家动画帧
  player.value.frameTime += deltaTime
  if (player.value.frameTime >= player.value.frameDuration) {
    player.value.frame = (player.value.frame + 1) % 4
    player.value.frameTime = 0
  }

  // 更新NPC动画帧
  npcs.value.forEach(npc => {
    npc.frameTime += deltaTime
    if (npc.frameTime >= npc.frameDuration) {
      npc.frame = (npc.frame + 1) % 5 // 5列，所以是5帧循环
      npc.frameTime = 0
    }
  })
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

  // 更新朝向（优先水平方向，其次垂直方向）
  if (dx < 0) {
    p.direction = 'left'
  } else if (dx > 0) {
    p.direction = 'right'
  } else if (dy < 0) {
    p.direction = 'up'
  } else if (dy > 0) {
    p.direction = 'down'
  }

  // 边界检测
  p.x = Math.max(0, Math.min(canvasWidth - p.width, p.x))
  p.y = Math.max(250, Math.min(canvasHeight - p.height, p.y))
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

  // 绘制玩家（如果激活技能则绘制技能动画）
  drawPlayer()

  // 绘制NPC
  drawNpcs()

  gameLoopId = requestAnimationFrame(gameLoop)
}

// 输入处理
const handleKeyDown = (e) => {
  const key = e.key.toLowerCase()
  if (keys.hasOwnProperty(key)) {
    keys[key] = true
    e.preventDefault()

    // J键释放技能
    if (key === 'j' && isPlaying.value) {
      releaseSkill()
    }
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
    drawNpcs()
    drawPlayer()
  }
}

const selectScene = async (scene) => {
  selectedScene.value = scene

  // 如果是自定义背景场景，预加载背景图片
  if (scene.isCustom && scene.backgroundImage) {
    customBackgroundImage.value = scene.backgroundImage

    const img = new Image()
    // 不设置 crossOrigin，避免 CORS 问题

    await new Promise((resolve) => {
      img.onload = () => {
        console.log('背景图片预加载成功')
        customBackgroundImgObj.value = img
        resolve()
      }
      img.onerror = (e) => {
        console.error('背景图片预加载失败:', scene.backgroundImage, e)
        customBackgroundImgObj.value = null
        resolve()
      }
      img.src = scene.backgroundImage
    })
  }

  if (!isPlaying.value && ctx) {
    drawScene()
    drawNpcs()
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

.skill-key {
  border-color: #FF6B6B;
  background: linear-gradient(135deg, #FFE66D, #FF6B6B);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.key-desc {
  font-size: 0.9rem;
  color: var(--text-light);
}

.skill-hint {
  margin-top: 15px;
  padding: 12px 16px;
  background: var(--浅雾);
  border-radius: 10px;
  font-size: 0.85rem;
  color: var(--text-dark);
  line-height: 1.5;
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
