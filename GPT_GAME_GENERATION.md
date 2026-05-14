# GPT 生成游戏资源指南

本项目支持使用 GPT（或 Qwen）生成像素风游戏资源，然后集成到游戏中。

## 1. 生成角色精灵图

### 提示词模板

```
请为我生成一个 32×32 像素的 RPG 角色精灵图，包含 4 个动画帧（走路动画）。

角色描述：
- 职业：{{ 职业 }}（战士/法师/弓箭手/盗贼）
- 配色：{{ 配色方案 }}
- 风格：{{ 风格描述 }}

请返回以下格式：
1. ASCII 艺术图（可以直接看到效果）
2. 颜色代码映射
3. 每个像素的坐标和颜色
4. 适合 Canvas drawImage 的绘制代码
```

### 示例：生成战士角色

```javascript
// 在 ai-service.js 中添加
export async function generateCharacterSprite(description) {
  const prompt = `请生成一个 32×32 像素的 RPG 战士角色精灵图，包含 4 帧。

角色描述：${description}
- 戴头盔，穿红色盔甲
- 手持长剑
- 走路动画（左腿抬起-右腿抬起）

请返回 JSON 格式：
{
  "name": "战士",
  "color": "#FF6B6B",
  "frames": [
    {"frame": 0, "pixels": [[0,0,"#ffffff"],[0,1,"#FFE66D"],...]},
    {"frame": 1, "pixels": [[0,0,"#ffffff"],[0,1,"#FFE66D"],...]},
    {"frame": 2, "pixels": [[0,0,"#ffffff"],[0,1,"#FFE66D"],...]},
    {"frame": 3, "pixels": [[0,0,"#ffffff"],[0,1,"#FFE66D"],...]}
  ]
}`

  const response = await callQwenAPI(prompt, '你是一个专业的像素艺术家，擅长创建游戏精灵图。')
  const data = JSON.parse(response)
  return data
}
```

## 2. 生成道具物品

### 提示词模板

```
请生成游戏道具的 16×16 像素图标：
- 名称：{{ 道具名称 }}
- 类型：{{ 消耗品/装备/任务物品 }}
- 效果：{{ 游戏效果 }}

返回格式：
{
  "name": "生命药水",
  "icon": ASCII 艺术,
  "colorMap": {...},
  "drawCode": "JavaScript Canvas 代码"
}
```

## 3. 生成游戏场景

### 提示词模板

```
请生成一个 800×480 像素的横板游戏场景背景：

场景类型：{{ 场景类型 }}
- 时间：{{ 白天/夜晚/黄昏 }}
- 天气：{{ 晴天/阴天/雨天 }}
- 季节：{{ 季节 }}

元素要求：
1. 天空和云朵
2. 远景（山脉、建筑）
3. 地面（草地、道路）
4. 装饰物（树木、石头）
5. 背景层深度

返回：
1. 场景描述
2. 颜色配置
3. 各层的绘制代码
4. 优化的性能建议
```

## 4. 集成到游戏引擎

### 添加 AI 生成功能到游戏

```javascript
// 在 PixelGame.vue 中添加
import { generateCharacterSprite } from '@/utils/ai-service'

const generateNewCharacter = async () => {
  try {
    const description = {
      profession: '暗影刺客',
      colorScheme: '黑色和紫色',
      weapon: '双匕首',
      features: '披风、面具'
    }

    const characterData = await generateCharacterSprite(description)

    // 添加到角色列表
    characters.value.push({
      id: Date.now(),
      name: characterData.name,
      draw: (ctx, x, y, frame, direction) => {
        // 使用 AI 生成的像素数据绘制
        drawGeneratedSprite(ctx, x, y, characterData.frames[frame])
      }
    })

    selectedCharacter.value = characters.value[characters.value.length - 1]
  } catch (error) {
    console.error('生成角色失败:', error)
    alert('AI 生成失败：' + error.message)
  }
}

const drawGeneratedSprite = (ctx, startX, startY, pixels) => {
  const pixelSize = 1

  pixels.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color && color !== 'transparent') {
        ctx.fillStyle = color
        ctx.fillRect(
          startX + x * pixelSize,
          startY + y * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    })
  })
}
```

## 5. 批量生成资源

### 生成完整游戏资源包

```javascript
export async function generateGameAssets(gameTheme) {
  const assets = {
    characters: [],
    items: [],
    enemies: [],
    scenes: []
  }

  // 生成角色
  const professions = ['战士', '法师', '弓箭手', '盗贼']
  for (const prof of professions) {
    const character = await generateCharacterSprite({
      profession: prof,
      colorScheme: '自定义',
      weapon: '默认武器',
      features: '标准配置'
    })
    assets.characters.push(character)
  }

  // 生成道具
  const items = ['生命药水', '魔法药水', '金币', '钥匙', '地图']
  for (const item of items) {
    const itemData = await generateItemIcon(item)
    assets.items.push(itemData)
  }

  return assets
}
```

## 6. 优化生成质量

### 提示词优化技巧

1. **添加参考作品**
```
请参考《塞尔达传说》的角色风格，生成...
```

2. **指定技术限制**
```
- 限制调色板：8-16 种颜色
- 总像素数不超过 1024 个
- 确保单帧大小 < 2KB
```

3. **多轮迭代**
```javascript
const firstVersion = await generateCharacterSprite(description)

const refinedVersion = await callQwenAPI(
  `请优化这个角色：${JSON.stringify(firstVersion)}
   - 增强细节
   - 优化配色
   - 添加阴影效果`,
  '你是一个像素艺术优化专家'
)
```

## 7. 实时预览和编辑

### 添加预览功能

```javascript
const previewGeneratedAsset = (assetData) => {
  // 创建预览 Canvas
  const previewCanvas = document.createElement('canvas')
  previewCanvas.width = 64
  previewCanvas.height = 64
  const ctx = previewCanvas.getContext('2d')

  // 绘制预览
  drawGeneratedSprite(ctx, 0, 0, assetData.frames[0])

  return previewCanvas.toDataURL()
}
```

## 8. 保存生成的资源

### 保存到数据库

```javascript
export async function saveGeneratedAssets(assets) {
  // 保存角色
  for (const character of assets.characters) {
    await addGalleryItem({
      title: character.name,
      description: `AI 生成的${character.name}角色`,
      category: '游戏素材',
      categoryId: 'game',
      type: 'image',
      image: await generateSpriteSheet(character.frames)
    })
  }
}
```

## 使用流程

1. **设计阶段**：在工具菜单选择"像素游戏"
2. **生成资源**：点击"AI 生成"按钮
3. **自定义**：输入角色/道具描述
4. **预览**：查看生成的像素图
5. **集成**：直接添加到游戏中
6. **测试**：在游戏中实时使用

## 注意事项

- ⏱️ AI 生成需要 5-15 秒，请耐心等待
- 💾 生成的资源会保存到本地，可重复使用
- 🎨 艺术效果依赖于提示词质量
- 🔄 不满意可以重新生成

## 扩展建议

1. **添加动画编辑器**：手动调整 AI 生成的帧
2. **批量导出**：导出为游戏引擎格式（Unity Sprite）
3. **版本管理**：保存不同版本的角色
4. **社区分享**：上传和下载其他用户创作的资源
