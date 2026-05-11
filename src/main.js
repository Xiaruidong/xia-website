import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { initSampleData, STORAGE_MODE } from './utils/storage'
import { initSupabase } from './utils/supabase'

// 初始化应用
const initApp = async () => {
  // 如果使用 Supabase，先初始化 Supabase
  if (STORAGE_MODE === 'supabase') {
    const initialized = initSupabase()
    if (initialized) {
      await initSampleData()
    }
  } else {
    initSampleData()
  }

  createApp(App).use(router).mount('#app')
}

initApp()
