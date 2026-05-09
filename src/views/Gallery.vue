<template>
  <div class="gallery-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">画廊</h1>
        <p class="page-subtitle">光影记录 · 生活碎片</p>
        <div class="header-divider"></div>
      </div>
    </div>

    <div class="gallery-container">
      <!-- 分类筛选 -->
      <div class="category-filter">
        <button
          v-for="category in categories"
          :key="category.id"
          class="category-btn"
          :class="{ active: selectedCategory === category.id }"
          @click="selectedCategory = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- 图片网格 -->
      <div class="gallery-grid">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="gallery-item"
          @click="openLightbox(item)"
        >
          <div class="gallery-image" :style="getImageStyle(item)">
            <img v-if="item.type === 'image'" :src="item.image" class="image-actual" />
            <span v-else class="image-icon">{{ item.icon }}</span>
          </div>
          <div class="gallery-info">
            <div class="item-badges">
              <span v-if="item.type === 'image' && isGIF(item)" class="gif-badge">GIF</span>
            </div>
            <h3 class="item-title">{{ item.title }}</h3>
            <p class="item-description">{{ item.description }}</p>
            <div class="item-meta">
              <span class="item-date">{{ item.date }}</span>
              <span class="item-category">{{ item.category }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <span class="empty-icon">🍃</span>
        <p>暂无相关内容</p>
      </div>
    </div>

    <!-- Lightbox -->
    <transition name="lightbox">
      <div v-if="lightboxOpen" class="lightbox" @click="closeLightbox">
        <button class="lightbox-close" @click.stop="closeLightbox">×</button>
        <div class="lightbox-content" @click.stop>
          <div class="lightbox-image" :style="getLightboxImageStyle(selectedItem)">
            <img v-if="selectedItem?.type === 'image'" :src="selectedItem.image" class="lightbox-image-actual" />
            <span v-else class="lightbox-icon">{{ selectedItem?.icon }}</span>
          </div>
          <div class="lightbox-info">
            <h2 class="lightbox-title">{{ selectedItem?.title }}</h2>
            <p class="lightbox-description">{{ selectedItem?.description }}</p>
            <div class="lightbox-meta">
              <span>{{ selectedItem?.date }}</span>
              <span>{{ selectedItem?.category }}</span>
            </div>
          </div>
          <button class="lightbox-nav prev" @click.stop="navigate(-1)" v-if="hasPrev">←</button>
          <button class="lightbox-nav next" @click.stop="navigate(1)" v-if="hasNext">→</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getGalleryItems } from '../utils/storage'

const selectedCategory = ref('all')
const lightboxOpen = ref(false)
const selectedItem = ref(null)
const currentIndex = ref(0)

const categories = ref([
  { id: 'all', name: '全部' },
  { id: 'winter', name: '冬日' },
  { id: 'nature', name: '自然' },
  { id: 'life', name: '生活' },
  { id: 'detail', name: '细节' }
])

const galleryItems = ref([])

onMounted(() => {
  galleryItems.value = getGalleryItems()
  window.addEventListener('keydown', handleKeydown)
})

const filteredItems = computed(() => {
  if (selectedCategory.value === 'all') {
    return galleryItems.value
  }
  return galleryItems.value.filter(item => item.categoryId === selectedCategory.value)
})

const currentFilteredIndex = computed(() => {
  return filteredItems.value.findIndex(item => item.id === selectedItem.value?.id)
})

const hasPrev = computed(() => currentFilteredIndex.value > 0)
const hasNext = computed(() => currentFilteredIndex.value < filteredItems.value.length - 1)

const openLightbox = (item) => {
  selectedItem.value = item
  currentIndex.value = filteredItems.value.findIndex(i => i.id === item.id)
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const getImageStyle = (item) => {
  if (item.type === 'image') {
    return { background: '#f5f5f5' }
  }
  return { background: item.gradient }
}

const getLightboxImageStyle = (item) => {
  if (item?.type === 'image') {
    return { background: 'transparent' }
  }
  return { background: item?.gradient }
}

const navigate = (direction) => {
  const newIndex = currentFilteredIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredItems.value.length) {
    selectedItem.value = filteredItems.value[newIndex]
  }
}

const handleKeydown = (e) => {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') navigate(-1)
  if (e.key === 'ArrowRight') navigate(1)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

const isGIF = (item) => {
  return item.type === 'image' && item.image && item.image.includes('image/gif')
}
</script>

<style scoped>
.gallery-page {
  padding-top: 120px;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  text-align: center;
  padding: 60px 0 40px;
}

.page-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 200;
  letter-spacing: 0.5rem;
  color: var(--浅青灰);
  margin-bottom: 15px;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--深霜蓝);
  letter-spacing: 0.3rem;
  font-weight: 200;
  margin-bottom: 30px;
}

.header-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 0 auto;
}

/* Gallery Container */
.gallery-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px 60px;
}

/* Category Filter */
.category-filter {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 50px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 10px 25px;
  border: 1px solid var(--霜蓝);
  border-radius: 25px;
  background: transparent;
  color: var(--浅青灰);
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  background: var(--浅雾);
  transform: translateY(-2px);
}

.category-btn.active {
  background: var(--浅青灰);
  color: var(--米白);
  border-color: var(--浅青灰);
}

/* Gallery Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}

.gallery-item {
  background: var(--柔白);
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gallery-item:hover {
  transform: translateY(-10px);
  box-shadow: 0 15px 40px rgba(200, 217, 230, 0.25);
}

.gallery-image {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.image-actual {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-icon {
  font-size: 5rem;
  opacity: 0.8;
}

.gallery-info {
  padding: 25px;
}

.item-badges {
  margin-bottom: 10px;
}

.gif-badge {
  display: inline-block;
  padding: 3px 8px;
  background: linear-gradient(135deg, #FF6B6B, #FF8E53);
  color: white;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05rem;
}

.item-title {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 10px;
  font-weight: 400;
}

.item-description {
  color: var(--text-light);
  line-height: 1.6;
  font-size: 0.9rem;
  margin-bottom: 15px;
  font-weight: 200;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 0;
  color: var(--text-light);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.lightbox-close {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 2rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.lightbox-content {
  max-width: 900px;
  width: 100%;
  background: var(--柔白);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.lightbox-image {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image-actual {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lightbox-icon {
  font-size: 8rem;
  opacity: 0.8;
}

.lightbox-info {
  padding: 40px;
}

.lightbox-title {
  font-size: 1.8rem;
  color: var(--text-dark);
  margin-bottom: 15px;
  font-weight: 300;
}

.lightbox-description {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 1.1rem;
  margin-bottom: 20px;
  font-weight: 200;
}

.lightbox-meta {
  display: flex;
  gap: 30px;
  font-size: 0.9rem;
  color: var(--深霜蓝);
  font-weight: 200;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  color: var(--浅青灰);
  font-size: 1.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lightbox-nav:hover {
  background: white;
  transform: translateY(-50%) scale(1.1);
}

.lightbox-nav.prev {
  left: 20px;
}

.lightbox-nav.next {
  right: 20px;
}

/* Lightbox Transition */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.3s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .gallery-page {
    padding-top: 100px;
  }

  .page-title {
    letter-spacing: 0.3rem;
  }

  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }

  .lightbox-image {
    height: 300px;
  }

  .lightbox-icon {
    font-size: 5rem;
  }

  .lightbox-info {
    padding: 30px 25px;
  }

  .lightbox-title {
    font-size: 1.4rem;
  }

  .lightbox-description {
    font-size: 1rem;
  }
}
</style>
