<template>
  <div id="app">
    <SnowEffect />
    <Navigation />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import Navigation from './components/Navigation.vue'
import Footer from './components/Footer.vue'
import SnowEffect from './components/SnowEffect.vue'
</script>

<style scoped>
.main-content {
  position: relative;
  z-index: 2;
  min-height: calc(100vh - 140px);
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
