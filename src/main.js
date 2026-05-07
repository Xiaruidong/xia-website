import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { initSampleData } from './utils/storage'

// 初始化示例数据
initSampleData()

createApp(App).use(router).mount('#app')
