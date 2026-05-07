<template>
  <div class="blog-post-page">
    <div class="post-container">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$router.back()">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>

      <!-- 文章头部 -->
      <header class="post-header">
        <span class="post-category">{{ post.category }}</span>
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <span class="meta-item">
            <span class="meta-icon">📅</span>
            {{ post.date }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">⏱</span>
            {{ post.readTime }}
          </span>
          <span class="meta-item">
            <span class="meta-icon">👁</span>
            {{ post.views }} 阅读
          </span>
        </div>
      </header>

      <!-- 文章内容 -->
      <article class="post-content">
        <div class="prose" v-html="post.content"></div>
      </article>

      <!-- 文章标签 -->
      <div class="post-tags">
        <span class="tag" v-for="tag in post.tags" :key="tag">{{ tag }}</span>
      </div>

      <!-- 上一篇/下一篇 -->
      <div class="post-navigation">
        <button
          v-if="prevPost"
          class="nav-btn prev"
          @click="$router.push(`/blog/${prevPost.id}`)"
        >
          <span class="nav-label">上一篇</span>
          <span class="nav-title">{{ prevPost.title }}</span>
        </button>
        <button
          v-if="nextPost"
          class="nav-btn next"
          @click="$router.push(`/blog/${nextPost.id}`)"
        >
          <span class="nav-label">下一篇</span>
          <span class="nav-title">{{ nextPost.title }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPosts } from '../utils/storage'

const route = useRoute()
const postId = ref(parseInt(route.params.id))

const allPosts = getPosts()
const post = ref(allPosts.find(p => p.id === postId.value) || allPosts[0])

const currentIndex = allPosts.findIndex(p => p.id === postId.value)

const prevPost = computed(() => {
  if (currentIndex > 0) {
    return allPosts[currentIndex - 1]
  }
  return null
})

const nextPost = computed(() => {
  if (currentIndex < allPosts.length - 1) {
    return allPosts[currentIndex + 1]
  }
  return null
})

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.blog-post-page {
  padding-top: 120px;
  min-height: 100vh;
  padding-bottom: 60px;
}

.post-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 30px;
}

/* Back Button */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--霜蓝);
  border-radius: 25px;
  color: var(--浅青灰);
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 40px;
}

.back-btn:hover {
  background: var(--浅雾);
  transform: translateX(-5px);
}

.back-icon {
  font-size: 1.2rem;
}

/* Post Header */
.post-header {
  text-align: center;
  margin-bottom: 50px;
}

.post-category {
  display: inline-block;
  padding: 8px 25px;
  background: var(--浅雾);
  border-radius: 25px;
  font-size: 0.85rem;
  color: var(--浅青灰);
  letter-spacing: 0.15rem;
  margin-bottom: 25px;
}

.post-title {
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 300;
  color: var(--text-dark);
  line-height: 1.4;
  margin-bottom: 20px;
  letter-spacing: 0.1rem;
}

.post-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 0.85rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-icon {
  margin-right: 5px;
}

/* Post Content */
.post-content {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 50px;
  margin-bottom: 40px;
  box-shadow: 0 10px 40px rgba(200, 217, 230, 0.15);
}

.prose {
  color: var(--text-dark);
  line-height: 2;
  font-size: 1.05rem;
  font-weight: 200;
}

.prose :deep(p) {
  margin-bottom: 1.5rem;
}

.prose :deep(h3) {
  font-size: 1.4rem;
  font-weight: 400;
  color: var(--text-dark);
  margin: 2.5rem 0 1rem;
  letter-spacing: 0.1rem;
}

.prose :deep(blockquote) {
  border-left: 3px solid var(--霜蓝);
  padding-left: 20px;
  margin: 2rem 0;
  font-style: italic;
  color: var(--text-light);
}

/* Post Tags */
.post-tags {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.tag {
  padding: 8px 20px;
  background: var(--浅雾);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--浅青灰);
  letter-spacing: 0.1rem;
}

/* Post Navigation */
.post-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--霜蓝);
  border-radius: 15px;
  padding: 25px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: var(--浅雾);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(200, 217, 230, 0.2);
}

.nav-btn.next {
  text-align: right;
}

.nav-label {
  display: block;
  font-size: 0.8rem;
  color: var(--深霜蓝);
  letter-spacing: 0.1rem;
  margin-bottom: 10px;
}

.nav-title {
  display: block;
  font-size: 1rem;
  color: var(--浅青灰);
  font-weight: 300;
}

/* 响应式 */
@media (max-width: 768px) {
  .blog-post-page {
    padding-top: 100px;
  }

  .post-content {
    padding: 30px 25px;
  }

  .post-title {
    font-size: 1.6rem;
  }

  .post-meta {
    flex-direction: column;
    gap: 10px;
  }

  .post-navigation {
    grid-template-columns: 1fr;
  }

  .nav-btn.next {
    text-align: left;
  }
}
</style>
