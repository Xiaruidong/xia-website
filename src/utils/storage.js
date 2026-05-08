// 本地存储服务
const STORAGE_KEYS = {
  POSTS: 'xia_blog_posts',
  GALLERY: 'xia_gallery_items',
  AUTH: 'xia_auth_token'
}

// 获取数据
export const getPosts = () => {
  const data = localStorage.getItem(STORAGE_KEYS.POSTS)
  return data ? JSON.parse(data) : []
}

export const getGalleryItems = () => {
  const data = localStorage.getItem(STORAGE_KEYS.GALLERY)
  return data ? JSON.parse(data) : []
}

// 保存数据
export const savePosts = (posts) => {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
}

export const saveGalleryItems = (items) => {
  localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items))
}

// 文章操作
export const addPost = (post) => {
  const posts = getPosts()
  const newPost = {
    id: Date.now(),
    ...post,
    createdAt: new Date().toISOString()
  }
  posts.unshift(newPost)
  savePosts(posts)
  return newPost
}

export const updatePost = (id, updates) => {
  const posts = getPosts()
  const index = posts.findIndex(p => p.id === id)
  if (index !== -1) {
    posts[index] = { ...posts[index], ...updates }
    savePosts(posts)
    return posts[index]
  }
  return null
}

export const deletePost = (id) => {
  const posts = getPosts()
  const filtered = posts.filter(p => p.id !== id)
  savePosts(filtered)
  return filtered.length < posts.length
}

// 画廊操作
export const addGalleryItem = (item) => {
  const items = getGalleryItems()
  const newItem = {
    id: Date.now(),
    ...item,
    createdAt: new Date().toISOString()
  }
  items.unshift(newItem)
  saveGalleryItems(items)
  return newItem
}

export const updateGalleryItem = (id, updates) => {
  const items = getGalleryItems()
  const index = items.findIndex(i => i.id === id)
  if (index !== -1) {
    items[index] = { ...items[index], ...updates }
    saveGalleryItems(items)
    return items[index]
  }
  return null
}

export const deleteGalleryItem = (id) => {
  const items = getGalleryItems()
  const filtered = items.filter(i => i.id !== id)
  saveGalleryItems(filtered)
  return filtered.length < items.length
}

// 认证
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
export const initSampleData = () => {
  if (getPosts().length === 0) {
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

  if (getGalleryItems().length === 0) {
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
