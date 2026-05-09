// Leancloud 存储服务
import { queryAll, queryById, createRecord, updateRecord, deleteRecord } from './leancloud'

// 数据转换函数
const toPost = (avObject) => {
  if (!avObject) return null
  return {
    id: avObject.id,
    title: avObject.get('title'),
    excerpt: avObject.get('excerpt'),
    content: avObject.get('content'),
    category: avObject.get('category'),
    categoryId: avObject.get('categoryId'),
    date: avObject.get('date'),
    readTime: avObject.get('readTime'),
    views: avObject.get('views') || 0,
    tags: avObject.get('tags') || [],
    createdAt: avObject.get('createdAt')?.toISOString() || new Date().toISOString(),
    updatedAt: avObject.get('updatedAt')?.toISOString() || new Date().toISOString()
  }
}

const toGalleryItem = (avObject) => {
  if (!avObject) return null
  return {
    id: avObject.id,
    title: avObject.get('title'),
    description: avObject.get('description'),
    category: avObject.get('category'),
    categoryId: avObject.get('categoryId'),
    date: avObject.get('date'),
    type: avObject.get('type') || 'icon',
    icon: avObject.get('icon'),
    image: avObject.get('image'),
    gradient: avObject.get('gradient'),
    createdAt: avObject.get('createdAt')?.toISOString() || new Date().toISOString(),
    updatedAt: avObject.get('updatedAt')?.toISOString() || new Date().toISOString()
  }
}

// 获取数据
export const getPosts = async () => {
  try {
    const results = await queryAll('Post')
    return results.map(toPost).filter(Boolean)
  } catch (error) {
    console.error('获取文章失败:', error)
    return []
  }
}

export const getGalleryItems = async () => {
  try {
    const results = await queryAll('GalleryItem')
    return results.map(toGalleryItem).filter(Boolean)
  } catch (error) {
    console.error('获取画廊项目失败:', error)
    return []
  }
}

// 文章操作
export const addPost = async (post) => {
  try {
    const data = {
      ...post,
      views: post.views || 0,
      tags: post.tags || []
    }
    const result = await createRecord('Post', data)
    return toPost(result)
  } catch (error) {
    console.error('添加文章失败:', error)
    throw error
  }
}

export const updatePost = async (id, updates) => {
  try {
    const result = await updateRecord('Post', id, updates)
    return toPost(result)
  } catch (error) {
    console.error('更新文章失败:', error)
    throw error
  }
}

export const deletePost = async (id) => {
  try {
    await deleteRecord('Post', id)
    return true
  } catch (error) {
    console.error('删除文章失败:', error)
    return false
  }
}

// 画廊操作
export const addGalleryItem = async (item) => {
  try {
    const result = await createRecord('GalleryItem', item)
    return toGalleryItem(result)
  } catch (error) {
    console.error('添加画廊项目失败:', error)
    throw error
  }
}

export const updateGalleryItem = async (id, updates) => {
  try {
    const result = await updateRecord('GalleryItem', id, updates)
    return toGalleryItem(result)
  } catch (error) {
    console.error('更新画廊项目失败:', error)
    throw error
  }
}

export const deleteGalleryItem = async (id) => {
  try {
    await deleteRecord('GalleryItem', id)
    return true
  } catch (error) {
    console.error('删除画廊项目失败:', error)
    return false
  }
}

// 认证（使用 localStorage，因为不需要存储到服务器）
export const login = (password) => {
  if (password === 'admin123') {
    localStorage.setItem('xia_auth_token', Date.now().toString())
    return true
  }
  return false
}

export const logout = () => {
  localStorage.removeItem('xia_auth_token')
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('xia_auth_token')
}

// 初始化示例数据
export const initSampleData = async () => {
  try {
    const posts = await getPosts()
    if (posts.length === 0) {
      const samplePosts = [
        {
          title: '冬日清晨的第一杯茶',
          excerpt: '窗外飘着细雪，屋内茶香袅袅。这样的清晨，最适合静坐冥想，让思绪随着茶香慢慢舒展...',
          content: '<p>窗外飘着细雪，屋内茶香袅袅...</p>',
          category: '生活',
          categoryId: 'life',
          date: '2024.12.15',
          readTime: '5 min',
          views: 128,
          tags: ['生活', '冬日', '茶道']
        },
        {
          title: '关于独处的一些想法',
          excerpt: '独处不是孤独，而是与自己对话的最好时光...',
          content: '<p>独处不是孤独...</p>',
          category: '思考',
          categoryId: 'thinking',
          date: '2024.12.10',
          readTime: '8 min',
          views: 256,
          tags: ['思考', '独处', '成长']
        },
        {
          title: '雪天读书笔记',
          excerpt: '雪天最适合读书...',
          content: '<p>雪天最适合读书...</p>',
          category: '读书',
          categoryId: 'reading',
          date: '2024.12.05',
          readTime: '6 min',
          views: 189,
          tags: ['读书', '冬日', '笔记']
        }
      ]

      for (const post of samplePosts) {
        await addPost(post)
      }
      console.log('已初始化示例文章')
    }

    const galleryItems = await getGalleryItems()
    if (galleryItems.length === 0) {
      const sampleGallery = [
        {
          title: '初雪',
          description: '今冬的第一场雪，轻轻地落在窗台。',
          icon: '❄️',
          category: '冬日',
          categoryId: 'winter',
          date: '2024.12.01',
          gradient: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)',
          type: 'icon'
        },
        {
          title: '林间',
          description: '冬日的树林，静谧而深邃。',
          icon: '🌲',
          category: '自然',
          categoryId: 'nature',
          date: '2024.11.28',
          gradient: 'linear-gradient(135deg, #9BB8CE 0%, #8A9A9D 100%)',
          type: 'icon'
        }
      ]

      for (const item of sampleGallery) {
        await addGalleryItem(item)
      }
      console.log('已初始化示例画廊')
    }
  } catch (error) {
    console.error('初始化示例数据失败:', error)
  }
}
