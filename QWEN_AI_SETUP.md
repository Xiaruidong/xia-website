# Qwen AI 配置指南

本项目已集成阿里云 Qwen 大模型，用于研报智能结构化分析。

## 1. 获取 API Key

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 登录或注册阿里云账号
3. 进入"API-KEY 管理"
4. 创建新的 API-KEY
5. 复制 API Key（格式：sk-xxxxxx）

## 2. 配置项目

在项目根目录创建 `.env.local` 文件：

```bash
# 如果已有 .env.local，直接添加以下配置
echo "VITE_QWEN_API_KEY=sk-你的APIKey" >> .env.local
```

或手动编辑 `.env.local`：

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_QWEN_API_KEY=sk-你的APIKey
```

## 3. 使用 AI 结构化功能

### 步骤
1. 在研报工具页面上传 PDF
2. 点击"开始解析"提取文本
3. 点击"🤖 AI 结构化"按钮
4. 等待 AI 处理完成（通常 10-30 秒）
5. 查看结构化结果

### AI 输出结构

```json
{
  "summary": "研报核心观点摘要",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "sections": [
    {
      "title": "板块名称",
      "content": "板块内容摘要",
      "keyData": ["数据1", "数据2"],
      "analysis": "分析观点"
    }
  ],
  "strategies": {
    "overall": "整体策略建议",
    "shortTerm": "短期操作建议",
    "riskLevel": "低/中/高"
  },
  "dataHighlights": [
    {
      "indicator": "指标名称",
      "value": "数值",
      "change": "变化趋势",
      "importance": "高/中/低"
    }
  ]
}
```

## 4. 支持的模型

在 `src/utils/ai-service.js` 中可以切换模型：

```javascript
const AI_CONFIG = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus', // 可选：
  // qwen-turbo  - 速度快，成本最低
  // qwen-plus   - 平衡性能和成本（推荐）
  // qwen-max    - 最强性能，成本较高
  apiKey: import.meta.env.VITE_QWEN_API_KEY || ''
}
```

## 5. 计费说明

Qwen API 按实际使用量计费（免费额度）：

| 模型 | 输入价格 | 输出价格 | 免费额度 |
|------|----------|----------|----------|
| qwen-turbo | ¥0.0003/千tokens | ¥0.0006/千tokens | 100万tokens/月 |
| qwen-plus | ¥0.004/千tokens | ¥0.012/千tokens | 100万tokens/月 |
| qwen-max | ¥0.04/千tokens | ¥0.08/千tokens | 100万tokens/月 |

**估算**：处理一份 10 页研报约消耗 2000-5000 tokens，免费额度足够使用。

## 6. 常见问题

### Q: AI 调用失败？
A: 检查：
1. API Key 是否正确配置
2. 网络连接是否正常
3. 是否超出免费额度
4. 浏览器控制台是否有错误信息

### Q: 结构化结果不准确？
A: 可以：
1. 尝试切换不同的模型（qwen-plus 或 qwen-max）
2. 优化提示词模板（在 ai-service.js 中修改）
3. 手动编辑结构化结果（编辑功能开发中）

### Q: 处理速度慢？
A: 建议：
1. 使用 qwen-turbo 模型（速度最快）
2. 检查网络连接
3. 减少文本长度（只提取关键部分）

### Q: 如何保护 API Key？
A: 注意：
1. 永远不要将 `.env.local` 提交到 Git
2. 生产环境建议使用后端代理调用
3. 定期更换 API Key

## 7. 后端代理方案（推荐）

对于生产环境，建议通过后端调用 AI API，避免暴露 Key：

```javascript
// 前端调用后端
const response = await fetch('/api/ai/structure', {
  method: 'POST',
  body: JSON.stringify({ text: rawText })
})

// 后端调用 Qwen（示例）
// server.js
app.post('/api/ai/structure', async (req, res) => {
  const result = await callQwenAPI(req.body.text)
  res.json(result)
})
```

## 8. 扩展功能

AI 服务模块还提供其他功能：

```javascript
import {
  structureReportText,   // 结构化研报
  extractTableData,      // 提取表格数据
  generateSummary,       // 生成摘要
  streamQwenAPI         // 流式调用（实时显示）
} from '@/utils/ai-service'
```

### 流式调用示例

```javascript
let fullResponse = ''

await streamQwenAPI(
  prompt,
  (chunk) => {
    fullResponse += chunk
    console.log(chunk) // 实时输出
  },
  systemMessage
)
```

## 9. 隐私说明

- PDF 文本会发送到阿里云服务器进行处理
- 阿里云承诺不会存储用户数据
- 敏感研报建议使用私有化部署方案

## 10. 技术支持

- 阿里云百炼文档：https://help.aliyun.com/zh/dashscope/
- Qwen 技术文档：https://qwen.readthedocs.io/
- 问题反馈：在项目 GitHub 提交 Issue
