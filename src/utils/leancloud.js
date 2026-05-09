// Leancloud 配置文件
import AV from 'leancloud-storage'

// 从环境变量获取配置
const APP_ID = import.meta.env.VITE_LEANCLOUD_APP_ID || ''
const APP_KEY = import.meta.env.VITE_LEANCLOUD_APP_KEY || ''
const SERVER_URL = import.meta.env.VITE_LEANCLOUD_SERVER_URL || ''

export const initLeancloud = () => {
  if (!APP_ID || !APP_KEY) {
    console.warn('Leancloud 配置未找到，请在 .env.local 中配置 VITE_LEANCLOUD_APP_ID 和 VITE_LEANCLOUD_APP_KEY')
    return false
  }

  try {
    const config = {
      appId: APP_ID,
      appKey: APP_KEY
    }

    if (SERVER_URL) {
      config.serverUrl = SERVER_URL
    }

    AV.init(config)
    console.log('Leancloud 初始化成功')
    return true
  } catch (error) {
    console.error('Leancloud 初始化失败:', error)
    return false
  }
}

// 创建数据表（类）
export const PostClass = AV.Object.extend('Post')
export const GalleryItemClass = AV.Object.extend('GalleryItem')

// 查询所有数据
export const queryAll = (className) => {
  const query = new AV.Query(className)
  query.descending('createdAt')
  return query.find()
}

// 根据 ID 查询
export const queryById = (className, id) => {
  const query = new AV.Query(className)
  return query.get(id)
}

// 创建新记录
export const createRecord = (className, data) => {
  const Record = AV.Object.extend(className)
  const record = new Record()

  Object.keys(data).forEach(key => {
    record.set(key, data[key])
  })

  return record.save()
}

// 更新记录
export const updateRecord = (className, id, data) => {
  const record = AV.Object.createWithoutData(className, id)

  Object.keys(data).forEach(key => {
    record.set(key, data[key])
  })

  return record.save()
}

// 删除记录
export const deleteRecord = (className, id) => {
  const record = AV.Object.createWithoutData(className, id)
  return record.destroy()
}

export default AV
