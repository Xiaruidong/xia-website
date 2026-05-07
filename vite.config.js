import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/xia-website/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
