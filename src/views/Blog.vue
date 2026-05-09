<template>
  <div class="blog-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">博客</h1>
        <p class="page-subtitle">文字记录 · 思考沉淀</p>
        <div class="header-divider"></div>
      </div>
    </div>

    <div class="blog-container">
      <!-- 分类筛选 -->
      <div class="category-filter">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- 文章列表 -->
      <div class="blog-list">
        <article
          v-for="post in filteredPosts"
          :key="post.id"
          class="blog-item"
          @click="$router.push(`/blog/${post.id}`)"
        >
          <div class="blog-image" :style="{ background: post.color }">
            <span class="blog-category">{{ post.category }}</span>
          </div>
          <div class="blog-content">
            <h2 class="blog-title">{{ post.title }}</h2>
            <p class="blog-excerpt">{{ post.excerpt }}</p>
            <div class="blog-meta">
              <span class="blog-date">
                <span class="meta-icon">📅</span>
                {{ post.date }}
              </span>
              <span class="blog-read-time">
                <span class="meta-icon">⏱</span>
                {{ post.readTime }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredPosts.length === 0" class="empty-state">
        <span class="empty-icon">🍃</span>
        <p>暂无相关文章</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPosts } from '../utils/storage'

const selectedCategory = ref('all')
const posts = ref([])

const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'life', name: '生活' },
  { id: 'thinking', name: '思考' },
  { id: 'reading', name: '读书' },
  { id: 'tech', name: '技术' }
])

onMounted(async () => {
  posts.value = await getPosts()
})

const filteredPosts = computed(() => {
  if (selectedCategory.value === 'all') {
    return posts.value
  }
  return posts.value.filter(post => post.categoryId === selectedCategory.value)
})
</script>

<style scoped>
.blog-page {
  padding-top: 120px;
  min-height: 100vh;
}

/* Page Header */
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

/* Blog Container */
.blog-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 30px 60px;
}

/* Category Filter */
.category-filter {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 10px 25px;
  border: 1px solid var(--霜蓝);
  border-radius: 25px;
  background: transparent;
  color: var(--浅青灰);
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  background: var(--浅雾);
  transform: translateY(-2px);
}

.category-btn.active {
  background: var(--浅青灰);
  color: var(--米白);
  border-color: var(--浅青灰);
}

/* Blog List */
.blog-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.blog-item {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 30px;
  background: var(--柔白);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.blog-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(200, 217, 230, 0.25);
}

.blog-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.blog-category {
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--浅青灰);
  letter-spacing: 0.1rem;
}

.blog-content {
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.blog-title {
  font-size: 1.5rem;
  color: var(--text-dark);
  margin-bottom: 15px;
  font-weight: 400;
}

.blog-excerpt {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 0.95rem;
  margin-bottom: 20px;
  font-weight: 200;
}

.blog-meta {
  display: flex;
  gap: 25px;
  font-size: 0.85rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

.meta-icon {
  margin-right: 5px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--text-light);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-page {
    padding-top: 100px;
  }

  .page-title {
    letter-spacing: 0.3rem;
  }

  .blog-item {
    grid-template-columns: 1fr;
  }

  .blog-image {
    height: 180px;
  }

  .blog-content {
    padding: 25px;
  }

  .blog-title {
    font-size: 1.2rem;
  }

  .category-filter {
    gap: 10px;
  }

  .category-btn {
    padding: 8px 18px;
    font-size: 0.85rem;
  }
}
</style>
