/**
 * OpenAI Whisper API 服务
 * 用于语音转文字
 */

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions'

/**
 * 转录音频文件为文字
 * @param {File} audioFile - 音频文件
 * @param {string} apiKey - OpenAI API Key
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 转录结果
 */
export async function transcribeAudio(audioFile, apiKey, options = {}) {
  const formData = new FormData()

  // 添加音频文件
  formData.append('file', audioFile)

  // 添加模型参数
  formData.append('model', options.model || 'whisper-1')

  // 可选参数
  if (options.language) {
    formData.append('language', options.language)
  }

  if (options.prompt) {
    formData.append('prompt', options.prompt)
  }

  if (options.responseFormat) {
    formData.append('response_format', options.responseFormat)
  }

  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString())
  }

  try {
    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || '转录失败')
    }

    return await response.json()
  } catch (error) {
    console.error('Whisper API 调用失败:', error)
    throw error
  }
}

/**
 * 获取支持的语言列表
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英语' },
  { code: 'yue', name: '粤语' },
  { code: 'ja', name: '日语' },
  { code: 'ko', name: '韩语' },
  { code: 'es', name: '西班牙语' },
  { code: 'fr', name: '法语' },
  { code: 'de', name: '德语' },
  { code: 'it', name: '意大利语' },
  { code: 'pt', name: '葡萄牙语' },
  { code: 'ru', name: '俄语' },
  { code: 'ar', name: '阿拉伯语' },
  { code: 'hi', name: '印地语' },
  { code: 'th', name: '泰语' },
  { code: 'vi', name: '越南语' }
]

/**
 * 支持的音频格式
 */
export const SUPPORTED_FORMATS = [
  'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'
]

/**
 * 文件大小限制（25MB）
 */
export const MAX_FILE_SIZE = 25 * 1024 * 1024

/**
 * 验证音频文件
 */
export function validateAudioFile(file) {
  if (!file) {
    return { valid: false, error: '请选择音频文件' }
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  // 检查文件类型
  const fileExtension = file.name.split('.').pop().toLowerCase()
  if (!SUPPORTED_FORMATS.includes(fileExtension)) {
    return {
      valid: false,
      error: `不支持的文件格式。支持的格式: ${SUPPORTED_FORMATS.join(', ')}`
    }
  }

  return { valid: true }
}
