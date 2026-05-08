<template>
  <div class="gallery-admin">
    <div class="page-header">
      <h2 class="page-title">画廊管理</h2>
      <button @click="showAddModal = true" class="btn-primary">
        <span>+ 添加作品</span>
      </button>
    </div>

    <div class="gallery-grid">
      <div
        v-for="item in galleryItems"
        :key="item.id"
        class="gallery-item"
      >
        <div class="item-preview" :style="getItemPreviewStyle(item)">
          <img v-if="item.type === 'image'" :src="item.image" class="item-image" />
          <span v-else class="item-icon">{{ item.icon }}</span>
        </div>
        <div class="item-info">
          <div class="item-type-badge">{{ item.type === 'image' ? '图片' : '图标' }}</div>
          <h3 class="item-title">{{ item.title }}</h3>
          <p class="item-description">{{ item.description }}</p>
          <div class="item-meta">
            <span class="item-category">{{ item.category }}</span>
            <span class="item-date">{{ item.date }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button @click="editItem(item)" class="action-btn edit-btn">编辑</button>
          <button @click="confirmDelete(item)" class="action-btn delete-btn">删除</button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑模态框 -->
    <transition name="modal">
      <div v-if="showAddModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editingItem ? '编辑作品' : '添加作品' }}</h3>
            <button @click="closeModal" class="modal-close">×</button>
          </div>

          <form @submit.prevent="saveItem" class="modal-form">
            <div class="form-group">
              <label for="itemTitle">标题 *</label>
              <input
                id="itemTitle"
                v-model="itemForm.title"
                type="text"
                placeholder="作品标题"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="itemDescription">描述</label>
              <textarea
                id="itemDescription"
                v-model="itemForm.description"
                placeholder="作品描述"
                rows="3"
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="itemCategory">分类</label>
                <select id="itemCategory" v-model="itemForm.categoryId" class="form-select">
                  <option value="winter">冬日</option>
                  <option value="nature">自然</option>
                  <option value="life">生活</option>
                  <option value="detail">细节</option>
                </select>
              </div>

              <div class="form-group">
                <label for="itemDate">日期</label>
                <input
                  id="itemDate"
                  v-model="itemForm.date"
                  type="date"
                  class="form-input"
                />
              </div>
            </div>

            <!-- 类型选择 -->
            <div class="form-group">
              <label>作品类型</label>
              <div class="type-selector">
                <button
                  type="button"
                  class="type-btn"
                  :class="{ active: itemForm.type === 'icon' }"
                  @click="itemForm.type = 'icon'"
                >
                  <span>🎨</span>
                  <span>Emoji 图标</span>
                </button>
                <button
                  type="button"
                  class="type-btn"
                  :class="{ active: itemForm.type === 'image' }"
                  @click="itemForm.type = 'image'"
                >
                  <span>🖼️</span>
                  <span>上传图片</span>
                </button>
              </div>
            </div>

            <!-- Emoji 图标选项 -->
            <div v-if="itemForm.type === 'icon'" class="form-group">
              <label for="itemIcon">图标 emoji</label>
              <input
                id="itemIcon"
                v-model="itemForm.icon"
                type="text"
                placeholder="例如：❄️"
                class="form-input"
              />
              <div class="emoji-picker">
                <span
                  v-for="emoji in commonEmojis"
                  :key="emoji"
                  @click="itemForm.icon = emoji"
                  class="emoji-option"
                >{{ emoji }}</span>
              </div>

              <div class="form-group">
                <label for="itemGradient">渐变色</label>
                <div class="gradient-options">
                  <div
                    v-for="gradient in gradients"
                    :key="gradient.value"
                    class="gradient-option"
                    :class="{ active: itemForm.gradient === gradient.value }"
                    :style="{ background: gradient.value }"
                    @click="itemForm.gradient = gradient.value"
                  >
                    <span v-if="itemForm.gradient === gradient.value" class="check">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 图片上传选项 -->
            <div v-if="itemForm.type === 'image'" class="form-group">
              <label for="itemImage">上传图片</label>
              <div class="image-upload">
                <input
                  id="itemImage"
                  type="file"
                  accept="image/*,.gif"
                  @change="handleImageUpload"
                  class="file-input"
                  ref="fileInput"
                />
                <div class="upload-area" @click="$refs.fileInput.click()">
                  <div v-if="!itemForm.image" class="upload-placeholder">
                    <span class="upload-icon">📤</span>
                    <span>点击上传图片</span>
                    <span class="upload-hint">支持 PNG, JPG, GIF</span>
                  </div>
                  <div v-else class="upload-preview">
                    <img :src="itemForm.image" />
                    <button type="button" @click.prevent="removeImage" class="remove-image">
                      ×
                    </button>
                  </div>
                </div>
              </div>
              <p v-if="imageSize" class="image-size-info">图片大小: {{ imageSize }}</p>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-cancel">取消</button>
              <button type="submit" class="btn-save">保存</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGalleryItems, addGalleryItem, updateGalleryItem, deleteGalleryItem } from '../../utils/storage'

const galleryItems = ref([])
const showAddModal = ref(false)
const editingItem = ref(null)
const fileInput = ref(null)
const imageSize = ref('')

const itemForm = ref({
  title: '',
  description: '',
  categoryId: 'winter',
  date: '',
  type: 'icon',
  icon: '❄️',
  image: '',
  gradient: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)'
})

const categoryMap = {
  winter: '冬日',
  nature: '自然',
  life: '生活',
  detail: '细节'
}

const commonEmojis = ['❄️', '🌲', '🍵', '🌫', '🕯️', '🍂', '💎', '🌆', '📖', '☁️', '🌙', '⭐', '🎮', '👾', '🎨', '✨']

const gradients = [
  { value: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)', name: '浅蓝' },
  { value: 'linear-gradient(135deg, #F8F6F3 0%, #E8EFF4 100%)', name: '米白' },
  { value: 'linear-gradient(135deg, #C8D9E6 0%, #9BB8CE 100%)', name: '霜蓝' },
  { value: 'linear-gradient(135deg, #9BB8CE 0%, #8A9A9D 100%)', name: '青灰' },
  { value: 'linear-gradient(135deg, #F8F6F3 0%, #9BB8CE 100%)', name: '柔白' },
  { value: 'linear-gradient(135deg, #C8D9E6 0%, #E8EFF4 100%)', name: '淡霜' }
]

onMounted(() => {
  loadGallery()
})

const loadGallery = () => {
  galleryItems.value = getGalleryItems()
}

const getItemPreviewStyle = (item) => {
  if (item.type === 'image') {
    return { background: '#f5f5f5' }
  }
  return { background: item.gradient }
}

const closeModal = () => {
  showAddModal.value = false
  editingItem.value = null
  itemForm.value = {
    title: '',
    description: '',
    categoryId: 'winter',
    date: '',
    type: 'icon',
    icon: '❄️',
    image: '',
    gradient: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)'
  }
  imageSize.value = ''
}

const editItem = (item) => {
  editingItem.value = item
  itemForm.value = {
    title: item.title,
    description: item.description,
    categoryId: item.categoryId,
    date: item.date,
    type: item.type || 'icon',
    icon: item.icon || '❄️',
    image: item.image || '',
    gradient: item.gradient || 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)'
  }
  if (item.image) {
    imageSize.value = formatImageSize(item.image.length)
  }
  showAddModal.value = true
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件大小 (限制为 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB，请选择更小的图片')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    itemForm.value.image = e.target.result
    imageSize.value = formatImageSize(file.size)
  }
  reader.readAsDataURL(file)
}

const formatImageSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const removeImage = () => {
  itemForm.value.image = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  imageSize.value = ''
}

const saveItem = () => {
  if (!itemForm.value.title) {
    alert('请输入作品标题')
    return
  }

  if (itemForm.value.type === 'image' && !itemForm.value.image) {
    alert('请上传图片')
    return
  }

  const data = {
    title: itemForm.value.title,
    description: itemForm.value.description,
    category: categoryMap[itemForm.value.categoryId],
    categoryId: itemForm.value.categoryId,
    date: itemForm.value.date,
    type: itemForm.value.type,
    icon: itemForm.value.icon,
    image: itemForm.value.image,
    gradient: itemForm.value.gradient
  }

  if (editingItem.value) {
    updateGalleryItem(editingItem.value.id, data)
  } else {
    addGalleryItem(data)
  }

  loadGallery()
  closeModal()
}

const confirmDelete = (item) => {
  if (confirm(`确定要删除《${item.title}》吗？`)) {
    deleteGalleryItem(item.id)
    loadGallery()
  }
}
</script>

<style scoped>
.gallery-admin {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  font-weight: 400;
  letter-spacing: 0.2rem;
}

.btn-primary {
  padding: 12px 25px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 154, 157, 0.3);
}

/* Gallery Grid */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.gallery-item {
  background: var(--柔白);
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(200, 217, 230, 0.1);
}

.item-preview {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.item-image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-icon {
  font-size: 4rem;
}

.item-info {
  padding: 15px;
}

.item-type-badge {
  display: inline-block;
  padding: 4px 10px;
  background: var(--浅雾);
  border-radius: 10px;
  font-size: 0.75rem;
  color: var(--深霜蓝);
  margin-bottom: 8px;
}

.item-title {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 8px;
  font-weight: 400;
}

.item-description {
  color: var(--text-light);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 12px;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--深霜蓝);
}

.item-actions {
  padding: 12px 15px;
  border-top: 1px solid var(--浅雾);
  display: flex;
  gap: 10px;
}

.action-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.edit-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.delete-btn {
  background: #ffebee;
  color: #e57373;
}

.delete-btn:hover {
  background: #ef5350;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: var(--浅青灰);
  font-weight: 400;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--浅雾);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--浅青灰);
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 0.9rem;
  background: white;
  color: var(--text-dark);
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--深霜蓝);
  box-shadow: 0 0 0 3px rgba(200, 217, 230, 0.2);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

/* Type Selector */
.type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px;
  background: var(--浅雾);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-btn:hover {
  background: var(--霜蓝);
}

.type-btn.active {
  border-color: var(--浅青灰);
  background: var(--霜蓝);
}

.type-btn span:first-child {
  font-size: 1.5rem;
}

.type-btn span:last-child {
  font-size: 0.85rem;
  color: var(--浅青灰);
}

/* Emoji Picker */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.emoji-option {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.emoji-option:hover {
  background: var(--浅雾);
  transform: scale(1.2);
}

/* Gradient Options */
.gradient-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.gradient-option {
  height: 50px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.gradient-option:hover {
  transform: scale(1.05);
}

.gradient-option.active {
  border-color: var(--浅青灰);
}

.gradient-option .check {
  color: white;
  font-size: 1.2rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Image Upload */
.image-upload {
  margin-top: 8px;
}

.file-input {
  display: none;
}

.upload-area {
  border: 2px dashed var(--霜蓝);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--深霜蓝);
  background: var(--浅雾);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 30px;
  color: var(--浅青灰);
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--text-light);
}

.upload-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 200px;
}

.remove-image {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s ease;
}

.remove-image:hover {
  background: rgba(239, 83, 80, 0.9);
  transform: scale(1.1);
}

.image-size-info {
  font-size: 0.75rem;
  color: var(--text-light);
  margin-top: 5px;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.btn-cancel:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.btn-save {
  background: var(--浅青灰);
  color: var(--米白);
}

.btn-save:hover {
  background: var(--text-dark);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 600px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
