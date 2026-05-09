<template>
  <div class="posts-page">
    <div class="page-header">
      <h2 class="page-title">文章管理</h2>
      <router-link to="/admin/posts/new" class="btn-primary">
        <span>+ 新建文章</span>
      </router-link>
    </div>

    <div class="posts-list">
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-item"
      >
        <div class="post-info" @click="editPost(post.id)">
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-meta">
            <span class="post-category">{{ post.category }}</span>
            <span class="post-date">{{ post.date }}</span>
          </div>
          <p class="post-excerpt">{{ post.excerpt }}</p>
        </div>
        <div class="post-actions">
          <button @click="editPost(post.id)" class="action-btn edit-btn">编辑</button>
          <button @click="confirmDelete(post)" class="action-btn delete-btn">删除</button>
        </div>
      </div>

      <div v-if="posts.length === 0" class="empty-state">
        <span class="empty-icon">📝</span>
        <p>暂无文章</p>
        <router-link to="/admin/posts/new" class="btn-primary">创建第一篇文章</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts, deletePost } from '../../utils/storage'

const router = useRouter()
const posts = ref([])

onMounted(() => {
  loadPosts()
})

const loadPosts = async () => {
  posts.value = await getPosts()
}

const editPost = (id) => {
  router.push(`/admin/posts/${id}/edit`)
}

const confirmDelete = async (post) => {
  if (confirm(`确定要删除《${post.title}》吗？`)) {
    await deletePost(post.id)
    await loadPosts()
  }
}
</script>

<style scoped>
.posts-page {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  font-weight: 400;
  letter-spacing: 0.2rem;
}

.btn-primary {
  padding: 12px 25px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 154, 157, 0.3);
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-item {
  background: var(--柔白);
  border-radius: 15px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  align-items: center;
  box-shadow: 0 4px 15px rgba(200, 217, 230, 0.1);
}

.post-info {
  cursor: pointer;
}

.post-info:hover .post-title {
  color: var(--深霜蓝);
}

.post-title {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 10px;
  font-weight: 400;
  transition: color 0.3s ease;
}

.post-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.post-category {
  padding: 4px 12px;
  background: var(--浅雾);
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--深霜蓝);
}

.post-date {
  font-size: 0.85rem;
  color: var(--深霜蓝);
}

.post-excerpt {
  color: var(--text-light);
  font-size: 0.9rem;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.edit-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.delete-btn {
  background: #ffebee;
  color: #e57373;
}

.delete-btn:hover {
  background: #ef5350;
  color: white;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-light);
}

.empty-icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 20px;
}

.empty-state p {
  margin-bottom: 30px;
  font-size: 1rem;
}

@media (max-width: 600px) {
  .post-item {
    grid-template-columns: 1fr;
  }

  .post-actions {
    justify-content: flex-end;
  }
}
</style>
