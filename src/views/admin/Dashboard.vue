<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📝</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.posts }}</span>
          <span class="stat-label">文章总数</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🖼️</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.gallery }}</span>
          <span class="stat-label">画廊作品</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">👁</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.views }}</span>
          <span class="stat-label">总阅读量</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-info">
          <span class="stat-number">{{ stats.categories }}</span>
          <span class="stat-label">文章分类</span>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-section">
        <h2 class="section-title">快捷操作</h2>
        <div class="quick-actions">
          <router-link to="/admin/posts/new" class="action-card">
            <span class="action-icon">✍️</span>
            <span class="action-text">新建文章</span>
          </router-link>
          <router-link to="/admin/gallery" class="action-card">
            <span class="action-icon">📷</span>
            <span class="action-text">上传作品</span>
          </router-link>
        </div>
      </div>

      <div class="dashboard-section">
        <h2 class="section-title">最新文章</h2>
        <div class="recent-list">
          <div
            v-for="post in recentPosts"
            :key="post.id"
            class="recent-item"
            @click="$router.push(`/admin/posts/${post.id}/edit`)"
          >
            <div class="recent-info">
              <h3 class="recent-title">{{ post.title }}</h3>
              <span class="recent-date">{{ post.date }}</span>
            </div>
            <span class="recent-category">{{ post.category }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPosts, getGalleryItems } from '../../utils/storage'

const stats = ref({
  posts: 0,
  gallery: 0,
  views: 0,
  categories: 0
})

const recentPosts = ref([])

onMounted(() => {
  const posts = getPosts()
  const gallery = getGalleryItems()

  stats.value = {
    posts: posts.length,
    gallery: gallery.length,
    views: posts.reduce((sum, p) => sum + (p.views || 0), 0),
    categories: [...new Set(posts.map(p => p.categoryId))].length
  }

  recentPosts.value = posts.slice(0, 5)
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--柔白);
  border-radius: 20px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--浅雾);
  border-radius: 15px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 300;
  color: var(--浅青灰);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 25px;
}

.dashboard-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.section-title {
  font-size: 1.2rem;
  color: var(--浅青灰);
  margin-bottom: 20px;
  font-weight: 400;
  letter-spacing: 0.1rem;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px 20px;
  background: var(--浅雾);
  border-radius: 15px;
  text-decoration: none;
  color: var(--浅青灰);
  transition: all 0.3s ease;
}

.action-card:hover {
  background: var(--霜蓝);
  color: var(--米白);
  transform: translateY(-3px);
}

.action-icon {
  font-size: 2.5rem;
}

.action-text {
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
}

/* Recent List */
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--浅雾);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-item:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.recent-title {
  font-size: 0.95rem;
  font-weight: 400;
}

.recent-date {
  font-size: 0.8rem;
  opacity: 0.7;
}

.recent-category {
  padding: 5px 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  font-size: 0.8rem;
}

.recent-item:hover .recent-category {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
