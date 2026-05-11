// AI 服务模块 - 调用 Qwen 大模型进行文本结构化

// API 配置
const AI_CONFIG = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus', // 可选: qwen-turbo, qwen-plus, qwen-max
  apiKey: import.meta.env.VITE_QWEN_API_KEY || '',
  timeout: 60000 // 60秒超时
}

/**
 * 调用 Qwen API
 * @param {string} prompt - 提示词
 * @param {string} systemMessage - 系统消息
 * @param {object} options - 额外选项
 * @returns {Promise<string>} API 响应
 */
async function callQwenAPI(prompt, systemMessage = '', options = {}) {
  const { temperature = 0.7, maxTokens = 8000 } = options

  if (!AI_CONFIG.apiKey) {
    throw new Error('请配置 Qwen API Key（在 .env.local 中设置 VITE_QWEN_API_KEY）')
  }

  try {
    const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
        result_format: 'message' // 返回消息格式
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'API 调用失败')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Qwen API 调用失败:', error)
    throw error
  }
}

/**
 * 结构化研报文本
 * @param {string} rawText - 原始文本
 * @param {object} reportInfo - 研报基本信息
 * @returns {Promise<object>} 结构化数据
 */
export async function structureReportText(rawText, reportInfo = {}) {
  const systemMessage = `你是一个专业的期货研报分析助手。你的任务是将期货研报的原始文本转换为结构化的JSON格式。

请严格按照以下要求输出：
1. 必须返回纯JSON格式，不要有任何额外说明
2. 识别并提取所有主要板块
3. 提取关键数据和指标
4. 总结核心观点和策略建议
5. 识别重要数据表格`

  const prompt = `请将以下期货研报文本结构化。

研报信息：
- 标题：${reportInfo.title || '未知'}
- 类型：${reportInfo.reportType || '月报'}
- 品种：${reportInfo.category || '未知'}

原始文本：
${rawText}

请返回以下JSON格式（不要有其他内容）：
{
  "summary": "研报核心观点摘要（3-5句话）",
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
}`

  try {
    const response = await callQwenAPI(prompt, systemMessage, {
      temperature: 0.3, // 降低温度以获得更稳定的输出
      maxTokens: 8000
    })

    // 清理响应中的 markdown 代码块标记
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    // 解析 JSON
    const structuredData = JSON.parse(cleanedResponse)
    return structuredData
  } catch (error) {
    console.error('结构化解析失败:', error)
    throw new Error('AI 结构化失败：' + error.message)
  }
}

/**
 * 提取表格数据
 * @param {string} tableText - 表格文本
 * @returns {Promise<object>} 表格数据
 */
export async function extractTableData(tableText) {
  const systemMessage = `你是一个数据提取专家。请从文本中提取表格数据，返回JSON格式。`

  const prompt = `请从以下文本中提取表格数据：

${tableText}

请返回以下JSON格式：
{
  "headers": ["列1", "列2", "列3"],
  "rows": [
    ["数据1", "数据2", "数据3"],
    ["数据4", "数据5", "数据6"]
  ],
  "title": "表格标题",
  "description": "表格说明"
}`

  try {
    const response = await callQwenAPI(prompt, systemMessage, {
      temperature: 0.2,
      maxTokens: 4000
    })

    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    return JSON.parse(cleanedResponse)
  } catch (error) {
    console.error('表格数据提取失败:', error)
    throw new Error('表格提取失败：' + error.message)
  }
}

/**
 * 生成研报摘要
 * @param {object} structuredData - 结构化数据
 * @returns {Promise<string>} 摘要文本
 */
export async function generateSummary(structuredData) {
  const systemMessage = `你是一个专业的投资分析师。请根据结构化数据生成一份简洁的投资摘要。`

  const prompt = `请根据以下结构化数据生成一份投资摘要（200字以内）：

${JSON.stringify(structuredData, null, 2)}`

  try {
    return await callQwenAPI(prompt, systemMessage, {
      temperature: 0.5,
      maxTokens: 500
    })
  } catch (error) {
    console.error('摘要生成失败:', error)
    throw new Error('摘要生成失败：' + error.message)
  }
}

/**
 * 流式调用（用于实时显示）
 * @param {string} prompt - 提示词
 * @param {function} onChunk - 接收数据块的回调
 */
export async function streamQwenAPI(prompt, onChunk, systemMessage = '') {
  if (!AI_CONFIG.apiKey) {
    throw new Error('请配置 Qwen API Key')
  }

  try {
    const response = await fetch(`${AI_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 8000,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error('API 调用失败')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '').trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices[0]?.delta?.content
          if (content && onChunk) {
            onChunk(content)
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  } catch (error) {
    console.error('流式API调用失败:', error)
    throw error
  }
}

export default {
  structureReportText,
  extractTableData,
  generateSummary,
  streamQwenAPI
}
