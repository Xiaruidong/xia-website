<template>
  <nav class="navigation" :class="{ 'scrolled': isScrolled }">
    <div class="nav-container">
      <router-link to="/" class="logo">
        <span class="logo-text">義</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/blog" class="nav-link">博客</router-link>
        <router-link to="/gallery" class="nav-link">画廊</router-link>
        <div class="nav-dropdown" @mouseenter="showToolsMenu = true" @mouseleave="showToolsMenu = false">
          <span class="nav-link">工具</span>
          <div class="dropdown-menu" :class="{ 'show': showToolsMenu }">
            <router-link to="/sprite-tool" class="dropdown-item">雪碧图工具</router-link>
            <router-link to="/report-tool" class="dropdown-item">研报解析</router-link>
            <router-link to="/pixel-game" class="dropdown-item">像素游戏</router-link>
            <router-link to="/job-crawler" class="dropdown-item">招聘爬虫</router-link>
          </div>
        </div>
        <router-link to="/about" class="nav-link">关于</router-link>
      </div>

      <button class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>

    <div class="mobile-menu" :class="{ 'open': mobileMenuOpen }">
      <router-link to="/" @click="mobileMenuOpen = false">首页</router-link>
      <router-link to="/blog" @click="mobileMenuOpen = false">博客</router-link>
      <router-link to="/gallery" @click="mobileMenuOpen = false">画廊</router-link>
      <router-link to="/sprite-tool" @click="mobileMenuOpen = false">雪碧图工具</router-link>
      <router-link to="/report-tool" @click="mobileMenuOpen = false">研报解析</router-link>
      <router-link to="/pixel-game" @click="mobileMenuOpen = false">像素游戏</router-link>
      <router-link to="/job-crawler" @click="mobileMenuOpen = false">招聘爬虫</router-link>
      <router-link to="/about" @click="mobileMenuOpen = false">关于</router-link>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const showToolsMenu = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.navigation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 20px 0;
  transition: all 0.3s ease;
}

.navigation.scrolled {
  background: rgba(248, 246, 243, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(200, 217, 230, 0.2);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.3rem;
  font-weight: 300;
  letter-spacing: 0.3rem;
  color: var(--浅青灰);
}

.logo-text {
  background: linear-gradient(135deg, var(--浅青灰), var(--深霜蓝));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 40px;
}

.nav-link {
  color: var(--浅青灰);
  font-size: 0.9rem;
  letter-spacing: 0.15rem;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--霜蓝);
  transition: width 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--深霜蓝);
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

/* 下拉菜单 */
.nav-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.nav-dropdown .nav-link {
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: var(--柔白);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(200, 217, 230, 0.3);
  min-width: 150px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  padding: 10px 0;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.dropdown-item {
  display: block;
  padding: 12px 20px;
  color: var(--浅青灰);
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.dropdown-item:hover {
  background: var(--浅雾);
  color: var(--深霜蓝);
}

.dropdown-item.router-link-active {
  background: var(--浅雾);
  color: var(--深霜蓝);
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.mobile-toggle span {
  width: 25px;
  height: 2px;
  background: var(--浅青灰);
  transition: all 0.3s ease;
}

.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(248, 246, 243, 0.98);
  backdrop-filter: blur(10px);
  flex-direction: column;
  padding: 20px;
  gap: 15px;
  border-bottom: 1px solid var(--浅雾);
}

.mobile-menu a {
  color: var(--浅青灰);
  padding: 10px 20px;
  text-align: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.mobile-menu a:hover,
.mobile-menu a.router-link-active {
  background: var(--浅雾);
  color: var(--深霜蓝);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .mobile-toggle {
    display: flex;
  }

  .mobile-menu {
    display: flex;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }

  .mobile-menu.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .mobile-toggle.open span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }

  .mobile-toggle.open span:nth-child(2) {
    opacity: 0;
  }

  .mobile-toggle.open span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
  }
}
</style>
