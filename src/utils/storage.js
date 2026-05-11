// 本地存储服务
const STORAGE_KEYS = {
  POSTS: 'xia_blog_posts',
  GALLERY: 'xia_gallery_items',
  AUTH: 'xia_auth_token'
}

// 存储模式配置：'local' | 'supabase'
const STORAGE_MODE = 'local' // 默认使用本地存储，配置 Supabase 后改为 'supabase'

// 导入 Supabase 存储
import * as SupabaseStorage from './storage-supabase'

// 本地存储函数
const getPostsLocal = () => {
  const data = localStorage.getItem(STORAGE_KEYS.POSTS)
  return data ? JSON.parse(data) : []
}

const getGalleryItemsLocal = () => {
  const data = localStorage.getItem(STORAGE_KEYS.GALLERY)
  return data ? JSON.parse(data) : []
}

const savePosts = (posts) => {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
}

const saveGalleryItems = (items) => {
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items))
}

// 导出统一的接口
export const getPosts = STORAGE_MODE === 'supabase' ? SupabaseStorage.getPosts : getPostsLocal
export const getGalleryItems = STORAGE_MODE === 'supabase' ? SupabaseStorage.getGalleryItems : getGalleryItemsLocal
export const addPost = STORAGE_MODE === 'supabase' ? SupabaseStorage.addPost : (post) => {
  const posts = getPostsLocal()
  const newPost = {
    id: Date.now(),
    ...post,
    createdAt: new Date().toISOString()
  }
  posts.unshift(newPost)
  savePosts(posts)
  return newPost
}

export const updatePost = STORAGE_MODE === 'supabase' ? SupabaseStorage.updatePost : (id, updates) => {
  const posts = getPostsLocal()
  const index = posts.findIndex(p => p.id === id)
  if (index !== -1) {
    posts[index] = { ...posts[index], ...updates }
    savePosts(posts)
    return posts[index]
  }
  return null
}

export const deletePost = STORAGE_MODE === 'supabase' ? SupabaseStorage.deletePost : (id) => {
  const posts = getPostsLocal()
  const filtered = posts.filter(p => p.id !== id)
  savePosts(filtered)
  return filtered.length < posts.length
}

export const addGalleryItem = STORAGE_MODE === 'supabase' ? SupabaseStorage.addGalleryItem : (item) => {
  const items = getGalleryItemsLocal()
  const newItem = {
    id: Date.now(),
    ...item,
    createdAt: new Date().toISOString()
  }
  items.unshift(newItem)
  saveGalleryItems(items)
  return newItem
}

export const updateGalleryItem = STORAGE_MODE === 'supabase' ? SupabaseStorage.updateGalleryItem : (id, updates) => {
  const items = getGalleryItemsLocal()
  const index = items.findIndex(i => i.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...updates }
    saveGalleryItems(items)
    return items[index]
  }
  return null
}

export const deleteGalleryItem = STORAGE_MODE === 'supabase' ? SupabaseStorage.deleteGalleryItem : (id) => {
  const items = getGalleryItemsLocal()
  const filtered = items.filter(i => i.id !== id)
  saveGalleryItems(filtered)
  return filtered.length < items.length
}

// 认证（始终使用 localStorage）
export const login = (password) => {
  // 简单的密码验证，生产环境应该使用更安全的方式
  if (password === 'admin123') {
    localStorage.setItem(STORAGE_KEYS.AUTH, Date.now().toString())
    return true
  }
  return false
}

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.AUTH)
}

export const isAuthenticated = () => {
  return !!localStorage.getItem(STORAGE_KEYS.AUTH)
}

// 初始化示例数据
export const initSampleData = STORAGE_MODE === 'supabase' ? SupabaseStorage.initSampleData : () => {
  if (getPostsLocal().length === 0) {
    const samplePosts = [
      {
        id: 1,
        title: '冬日清晨的第一杯茶',
        excerpt: '窗外飘着细雪，屋内茶香袅袅。这样的清晨，最适合静坐冥想，让思绪随着茶香慢慢舒展...',
        content: '<p>窗外飘着细雪，屋内茶香袅袅...</p>',
        category: '生活',
        categoryId: 'life',
        date: '2024.12.15',
        readTime: '5 min',
        views: 128,
        tags: ['生活', '冬日', '茶道'],
        createdAt: '2024-12-15T00:00:00.000Z'
      },
      {
        id: 2,
        title: '关于独处的一些想法',
        excerpt: '独处不是孤独，而是与自己对话的最好时光...',
        content: '<p>独处不是孤独...</p>',
        category: '思考',
        categoryId: 'thinking',
        date: '2024.12.10',
        readTime: '8 min',
        views: 256,
        tags: ['思考', '独处', '成长'],
        createdAt: '2024-12-10T00:00:00.000Z'
      },
      {
        id: 3,
        title: '雪天读书笔记',
        excerpt: '雪天最适合读书...',
        content: '<p>雪天最适合读书...</p>',
        category: '读书',
        categoryId: 'reading',
        date: '2024.12.05',
        readTime: '6 min',
        views: 189,
        tags: ['读书', '冬日', '笔记'],
        createdAt: '2024-12-05T00:00:00.000Z'
      }
    ]
    savePosts(samplePosts)
  }

  if (getGalleryItemsLocal().length === 0) {
    const sampleGallery = [
      {
        id: 1,
        title: '初雪',
        description: '今冬的第一场雪，轻轻地落在窗台。',
        icon: '❄️',
        category: '冬日',
        categoryId: 'winter',
        date: '2024.12.01',
        gradient: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)',
        type: 'icon',
        createdAt: '2024-12-01T00:00:00.000Z'
      },
      {
        id: 2,
        title: '林间',
        description: '冬日的树林，静谧而深邃。',
        icon: '🌲',
        category: '自然',
        categoryId: 'nature',
        date: '2024.11.28',
        gradient: 'linear-gradient(135deg, #9BB8CE 0%, #8A9A9D 100%)',
        type: 'icon',
        createdAt: '2024-11-28T00:00:00.000Z'
      }
    ]
    saveGalleryItems(sampleGallery)
  }
}

export { STORAGE_MODE }
