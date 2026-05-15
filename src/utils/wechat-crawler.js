/**
 * 微信公众号文章链接提取工具
 * 可以在前端或后端使用
 */

/**
 * 从文章HTML中提取投递链接
 * @param {string} html - 文章HTML内容
 * @returns {Array} 提取的链接列表
 */
export function extractApplicationLinks(html) {
  if (!html) return []

  const links = []
  const seenUrls = new Set()

  // 链接匹配规则
  const patterns = [
    // 招聘平台
    /(https?:\/\/[^\s<>"]*?(?:nowcoder|liepin|zhipin|bosszhipin|lagou|51job|zhaopin)\.[a-zA-Z]{2,3}[^\s<>"]*)/gi,
    // 表单工具
    /(https?:\/\/[^\s<>"]*?(?:wj\.cn|wenjuan\.com|wjx\.cn)[^\s<>"]*)/gi,
    // 腾讯文档
    /(https?:\/\/docs\.qq\.com\/form\/[^\s<>"]*)/gi,
    // 大厂招聘
    /(https?:\/\/[^\s<>"]*?(?:careers|jobs|campus)\.[^\s<>"]*?(?:apply|job|career|position)[^\s<>"]*)/gi,
  ]

  patterns.forEach(pattern => {
    const matches = html.match(pattern) || []
    matches.forEach(url => {
      // 清理URL
      const cleanUrl = cleanUrl(url)

      if (cleanUrl && cleanUrl.length > 20 && !seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl)
        links.push({
          url: cleanUrl,
          type: classifyLink(cleanUrl)
        })
      }
    })
  })

  return links
}

/**
 * 清理URL
 */
function cleanUrl(url) {
  if (!url) return ''

  return url
    .split('"')[0]
    .split("'")[0]
    .split('<')[0]
    .split(')')[0]
    .split('}')[0]
    .trim()
}

/**
 * 识别链接类型
 */
function classifyLink(url) {
  const urlLower = url.toLowerCase()

  const platforms = {
    'nowcoder': '牛客网',
    'liepin': '猎聘',
    'zhipin': 'BOSS直聘',
    'boss': 'BOSS直聘',
    'lagou': '拉勾',
    '51job': '前程无忧',
    'zhaopin': '前程无忧',
    'wj.cn': '问卷表单',
    'wenjuan': '问卷表单',
    'wjx.cn': '问卷星',
    'docs.qq.com': '腾讯文档',
    'alibaba': '阿里巴巴',
    'tencent': '腾讯',
    'bytedance': '字节跳动',
    'baidu': '百度',
    'meituan': '美团',
  }

  for (const [keyword, platform] of Object.entries(platforms)) {
    if (urlLower.includes(keyword)) {
      return platform
    }
  }

  if (urlLower.includes('apply') || urlLower.includes('job') || urlLower.includes('career')) {
    return '招聘官网'
  }

  return '其他链接'
}

/**
 * 从文本批量提取链接
 */
export function extractLinksFromText(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  const matches = text.match(urlPattern) || []

  return matches
    .map(url => cleanUrl(url))
    .filter(url => url.length > 20)
    .map(url => ({
      url,
      type: classifyLink(url)
    }))
}

/**
 * 过滤投递链接
 */
export function filterApplicationLinks(links) {
  const applicationKeywords = [
    '投递', '申请', '简历', '招聘', 'apply', 'application',
    'job', 'career', 'position', 'campus', 'intern'
  ]

  return links.filter(link => {
    const urlLower = link.url.toLowerCase()

    // 如果是已知的招聘平台，直接通过
    const knownPlatforms = ['nowcoder', 'liepin', 'zhipin', 'lagou', '51job', 'zhaopin']
    if (knownPlatforms.some(platform => urlLower.includes(platform))) {
      return true
    }

    // 检查是否包含招聘相关关键词
    return applicationKeywords.some(keyword => urlLower.includes(keyword))
  })
}

/**
 * 导出为CSV格式
 */
export function exportToCSV(data, filename = '投递链接.csv') {
  if (!data || data.length === 0) {
    alert('没有数据可导出')
    return
  }

  const headers = ['文章标题', '文章链接', '投递链接', '链接类型', '提取时间']
  const rows = data.flatMap(article =>
    article.links.map(link => [
      article.title,
      article.url,
      link.url,
      link.type,
      new Date().toLocaleString('zh-CN')
    ])
  )

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  // 添加BOM以支持中文
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}
