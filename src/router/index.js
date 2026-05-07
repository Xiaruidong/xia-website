import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../utils/storage'
import Home from '../views/Home.vue'
import Blog from '../views/Blog.vue'
import BlogPost from '../views/BlogPost.vue'
import Gallery from '../views/Gallery.vue'
import About from '../views/About.vue'
import AdminLogin from '../views/admin/Login.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'
import AdminPosts from '../views/admin/Posts.vue'
import AdminPostEdit from '../views/admin/PostEdit.vue'
import AdminGallery from '../views/admin/Gallery.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/blog',
    name: 'Blog',
    component: Blog
  },
  {
    path: '/blog/:id',
    name: 'BlogPost',
    component: BlogPost
  },
  {
    path: '/gallery',
    name: 'Gallery',
    component: Gallery
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/admin',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { requiresAuth: false }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/posts',
    name: 'AdminPosts',
    component: AdminPosts,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/posts/new',
    name: 'AdminPostNew',
    component: AdminPostEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/posts/:id/edit',
    name: 'AdminPostEdit',
    component: AdminPostEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/gallery',
    name: 'AdminGallery',
    component: AdminGallery,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0, behavior: 'smooth' }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/admin')
  } else if (to.path === '/admin' && isAuthenticated()) {
    next('/admin/dashboard')
  } else {
    next()
  }
})

export default router
