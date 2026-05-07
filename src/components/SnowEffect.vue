<template>
  <div class="snow-container" ref="snowContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const snowContainer = ref(null)
let snowInterval = null

const createSnowflake = () => {
  if (!snowContainer.value) return

  const snowflake = document.createElement('div')
  snowflake.className = 'snowflake'
  snowflake.innerHTML = '❄'
  snowflake.style.left = Math.random() * 100 + 'vw'
  snowflake.style.animationDuration = (Math.random() * 5 + 8) + 's'
  snowflake.style.opacity = Math.random() * 0.5 + 0.3
  snowflake.style.fontSize = (Math.random() * 10 + 8) + 'px'
  snowContainer.value.appendChild(snowflake)

  setTimeout(() => {
    snowflake.remove()
  }, 13000)
}

onMounted(() => {
  // 初始创建一些雪花
  for (let i = 0; i < 20; i++) {
    setTimeout(createSnowflake, Math.random() * 3000)
  }
  // 持续创建雪花
  snowInterval = setInterval(createSnowflake, 400)
})

onUnmounted(() => {
  if (snowInterval) {
    clearInterval(snowInterval)
  }
})
</script>

<style scoped>
.snow-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
</style>
