<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">第一场雪落在冬至</h1>
        <p class="hero-subtitle">XIA RUIDONG</p>
        <div class="hero-divider"></div>
        <p class="hero-description">
          喜欢在冬日里看雪，在文字间取暖。<br>
          这里是我的小小花园，种着一些文字与碎片。
        </p>
        <div class="hero-actions">
          <router-link to="/blog" class="btn btn-primary">
            <span>阅读文章</span>
            <span class="btn-arrow">→</span>
          </router-link>
          <router-link to="/gallery" class="btn btn-secondary">
            <span>浏览画廊</span>
          </router-link>
        </div>
      </div>

      <div class="hero-visual">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </section>

    <!-- 介绍卡片 -->
    <section class="intro-section">
      <div class="section-container">
        <div class="intro-grid">
          <div class="intro-card" v-for="item in introItems" :key="item.title">
            <div class="intro-icon">{{ item.icon }}</div>
            <h3 class="intro-title">{{ item.title }}</h3>
            <p class="intro-description">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 最新文章 -->
    <section class="latest-section">
      <div class="section-container">
        <h2 class="section-title">最新文章</h2>
        <div class="post-grid">
          <article
            v-for="post in latestPosts"
            :key="post.id"
            class="post-card"
            @click="$router.push(`/blog/${post.id}`)"
          >
            <div class="post-image" :style="{ background: post.color }">
              <span class="post-category">{{ post.category }}</span>
            </div>
            <div class="post-content">
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              <div class="post-meta">
                <span class="post-date">{{ post.date }}</span>
                <span class="post-read-time">{{ post.readTime }}</span>
              </div>
            </div>
          </article>
        </div>
        <div class="section-action">
          <router-link to="/blog" class="view-more">
            查看全部文章
            <span class="arrow">→</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- 生活碎片 -->
    <section class="moments-section">
      <div class="section-container">
        <h2 class="section-title">生活碎片</h2>
        <div class="moments-grid">
          <div class="moment-card" v-for="moment in moments" :key="moment.title">
            <span class="moment-emoji">{{ moment.emoji }}</span>
            <span class="moment-title">{{ moment.title }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPosts } from '../utils/storage'

const introItems = ref([
  {
    icon: '📖',
    title: '文字记录',
    description: '在键盘上敲下生活感悟，在文字中寻找内心平静'
  },
  {
    icon: '📷',
    title: '影像捕捉',
    description: '用镜头记录美好瞬间，让时光定格在画面中'
  },
  {
    icon: '☕',
    title: '生活感悟',
    description: '慢下来感受生活，在平凡中发现不平凡的美'
  }
])

const latestPosts = ref([])

const moments = ref([
  { emoji: '🕯️', title: '冬日煮茶' },
  { emoji: '📖', title: '深夜阅读' },
  { emoji: '🌲', title: '林间漫步' },
  { emoji: '❄️', title: '看雪落下' },
  { emoji: '✍️', title: '随笔记录' },
  { emoji: '☁️', title: '云端发呆' }
])

onMounted(() => {
  latestPosts.value = getPosts().slice(0, 3)
})
</script>

<style scoped>
.home {
  padding-top: 80px;
}

/* Hero Section */
.hero {
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 2;
  padding: 0 20px;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 200;
  letter-spacing: 1rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
  text-shadow: 0 4px 30px rgba(200, 217, 230, 0.3);
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1rem;
  color: var(--深霜蓝);
  letter-spacing: 0.5rem;
  font-weight: 200;
  margin-bottom: 30px;
}

.hero-divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 0 auto 40px;
}

.hero-description {
  color: var(--text-light);
  line-height: 2;
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto 50px;
  font-weight: 200;
}

.hero-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 35px;
  border-radius: 30px;
  font-size: 0.95rem;
  letter-spacing: 0.15rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-primary {
  background: var(--浅青灰);
  color: var(--米白);
}

.btn-primary:hover {
  background: var(--text-dark);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(138, 154, 157, 0.3);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.7);
  color: var(--浅青灰);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(200, 217, 230, 0.25);
}

.btn-arrow {
  transition: transform 0.3s ease;
}

.btn:hover .btn-arrow {
  transform: translateX(5px);
}

/* Hero Visual */
.hero-visual {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--霜蓝) 0%, transparent 70%);
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--浅雾) 0%, transparent 70%);
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, var(--深霜蓝) 0%, transparent 70%);
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
}

/* Sections */
.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  color: var(--浅青灰);
  letter-spacing: 0.3rem;
  margin-bottom: 50px;
  font-weight: 300;
}

/* Intro Section */
.intro-section {
  padding: 80px 0;
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.intro-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  transition: all 0.3s ease;
}

.intro-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(200, 217, 230, 0.2);
}

.intro-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.intro-title {
  font-size: 1.2rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
  font-weight: 400;
}

.intro-description {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 0.95rem;
  font-weight: 200;
}

/* Latest Section */
.latest-section {
  padding: 80px 0;
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.post-card {
  background: var(--柔白);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(200, 217, 230, 0.25);
}

.post-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.post-category {
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--浅青灰);
  letter-spacing: 0.1rem;
}

.post-content {
  padding: 25px;
}

.post-title {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 12px;
  font-weight: 400;
}

.post-excerpt {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 0.9rem;
  margin-bottom: 20px;
  font-weight: 200;
}

.post-meta {
  display: flex;
  gap: 15px;
  font-size: 0.85rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

.section-action {
  text-align: center;
}

.view-more {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--浅青灰);
  font-size: 0.95rem;
  letter-spacing: 0.15rem;
  padding: 12px 30px;
  border: 1px solid var(--霜蓝);
  border-radius: 25px;
  transition: all 0.3s ease;
}

.view-more:hover {
  background: var(--浅雾);
  transform: translateY(-2px);
}

.view-more .arrow {
  transition: transform 0.3s ease;
}

.view-more:hover .arrow {
  transform: translateX(5px);
}

/* Moments Section */
.moments-section {
  padding: 80px 0;
  margin-bottom: 40px;
}

.moments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.moment-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 30px 20px;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.moment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(200, 217, 230, 0.2);
}

.moment-emoji {
  font-size: 2.5rem;
}

.moment-title {
  color: var(--浅青灰);
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-title {
    letter-spacing: 0.5rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .btn {
    padding: 12px 25px;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .post-grid {
    grid-template-columns: 1fr;
  }
}
</style>
