import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { initSampleData, STORAGE_MODE } from './utils/storage'
import { initLeancloud } from './utils/leancloud'

// 初始化应用
const initApp = async () => {
  // 如果使用 Leancloud，先初始化 Leancloud
  if (STORAGE_MODE === 'leancloud') {
    const initialized = initLeancloud()
    if (initialized) {
      await initSampleData()
    }
  } else {
    initSampleData()
  }

  createApp(App).use(router).mount('#app')
}

initApp()
