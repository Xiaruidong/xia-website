<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <router-link to="/admin/dashboard" class="sidebar-logo">
          <span class="logo-icon">🌲</span>
          <span v-if="!sidebarCollapsed" class="logo-text">管理后台</span>
        </router-link>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
          <span :class="{ rotated: sidebarCollapsed }">◀</span>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/admin/dashboard" class="nav-item">
          <span class="nav-icon">📊</span>
          <span v-if="!sidebarCollapsed" class="nav-text">概览</span>
        </router-link>
        <router-link to="/admin/posts" class="nav-item">
          <span class="nav-icon">📝</span>
          <span v-if="!sidebarCollapsed" class="nav-text">文章管理</span>
        </router-link>
        <router-link to="/admin/gallery" class="nav-item">
          <span class="nav-icon">🖼️</span>
          <span v-if="!sidebarCollapsed" class="nav-text">画廊管理</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/" class="nav-item" target="_blank">
          <span class="nav-icon">🌐</span>
          <span v-if="!sidebarCollapsed" class="nav-text">查看网站</span>
        </router-link>
        <button @click="handleLogout" class="nav-item logout-btn">
          <span class="nav-icon">🚪</span>
          <span v-if="!sidebarCollapsed" class="nav-text">退出登录</span>
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="header-actions">
          <router-link to="/" class="view-site-btn" target="_blank">
            <span>查看网站</span>
            <span>→</span>
          </router-link>
        </div>
      </header>

      <div class="admin-content">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { logout } from '../../utils/storage'

const router = useRouter()
const route = useRoute()
const sidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  const titles = {
    'AdminDashboard': '概览',
    'AdminPosts': '文章管理',
    'AdminPostNew': '新建文章',
    'AdminPostEdit': '编辑文章',
    'AdminGallery': '画廊管理'
  }
  return titles[route.name] || '管理后台'
})

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    logout()
    router.push('/admin')
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--米白);
}

/* Sidebar */
.admin-sidebar {
  width: 260px;
  background: var(--柔白);
  border-right: 1px solid var(--浅雾);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.admin-sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--浅雾);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--浅青灰);
}

.logo-icon {
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 400;
  letter-spacing: 0.1rem;
  white-space: nowrap;
}

.sidebar-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  color: var(--浅青灰);
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.sidebar-toggle span {
  display: inline-block;
  transition: transform 0.3s ease;
}

.sidebar-toggle span.rotated {
  transform: rotate(180deg);
}

/* Sidebar Navigation */
.sidebar-nav {
  flex: 1;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--浅青灰);
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.nav-item:hover {
  background: var(--浅雾);
}

.nav-item.router-link-active {
  background: var(--霜蓝);
  color: var(--米白);
}

.nav-icon {
  font-size: 1.2rem;
  min-width: 24px;
}

.nav-text {
  white-space: nowrap;
}

.logout-btn {
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.sidebar-footer {
  padding: 20px 10px;
  border-top: 1px solid var(--浅雾);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Main Content */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 20px 30px;
  border-bottom: 1px solid var(--浅雾);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--浅青灰);
  letter-spacing: 0.2rem;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.view-site-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--霜蓝);
  color: var(--米白);
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.85rem;
  letter-spacing: 0.1rem;
  transition: all 0.3s ease;
}

.view-site-btn:hover {
  background: var(--深霜蓝);
  transform: translateY(-2px);
}

.admin-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
  }

  .admin-sidebar:not(.collapsed) {
    transform: translateX(0);
  }

  .admin-main {
    margin-left: 0;
  }

  .admin-header {
    padding: 15px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .admin-content {
    padding: 20px;
  }
}
</style>
