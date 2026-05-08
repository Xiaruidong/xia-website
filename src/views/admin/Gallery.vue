<template>
  <div class="gallery-admin">
    <div class="page-header">
      <h2 class="page-title">画廊管理</h2>
      <button @click="openModal" class="btn-primary">
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
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingItem ? '编辑作品' : '添加作品' }}</h3>
          <button @click="closeModal" class="modal-close">×</button>
        </div>

        <form @submit.prevent="saveItem" class="modal-form">
          <div class="form-group">
            <label>标题 *</label>
            <input
              v-model="itemForm.title"
              type="text"
              placeholder="作品标题"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="itemForm.description"
              placeholder="作品描述"
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>分类</label>
              <select v-model="itemForm.categoryId" class="form-select">
                <option value="winter">冬日</option>
                <option value="nature">自然</option>
                <option value="life">生活</option>
                <option value="detail">细节</option>
              </select>
            </div>

            <div class="form-group">
              <label>日期</label>
              <input
                v-model="itemForm.date"
                type="date"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>作品类型</label>
            <div class="type-selector">
              <button
                type="button"
                :class="{ active: itemForm.type === 'icon' }"
                @click="itemForm.type = 'icon'"
                class="type-btn"
              >
                🎨 Emoji 图标
              </button>
              <button
                type="button"
                :class="{ active: itemForm.type === 'image' }"
                @click="itemForm.type = 'image'"
                class="type-btn"
              >
                🖼️ 上传图片
              </button>
            </div>
          </div>

          <div v-if="itemForm.type === 'icon'">
            <div class="form-group">
              <label>图标 emoji</label>
              <input
                v-model="itemForm.icon"
                type="text"
                placeholder="例如：❄️"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>渐变色</label>
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

          <div v-if="itemForm.type === 'image'" class="form-group">
            <label>上传图片</label>
            <input
              type="file"
              accept="image/*,.gif"
              @change="handleImageUpload"
              class="file-input"
              ref="fileInputRef"
            />
            <div v-if="itemForm.image" class="upload-preview">
              <img :src="itemForm.image" />
              <button type="button" @click="removeImage" class="remove-image">×</button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">取消</button>
            <button type="submit" class="btn-save">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getGalleryItems, addGalleryItem, updateGalleryItem, deleteGalleryItem } from '../../utils/storage'

const galleryItems = ref([])
const showModal = ref(false)
const editingItem = ref(null)
const fileInputRef = ref(null)

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

const gradients = [
  { value: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)' },
  { value: 'linear-gradient(135deg, #F8F6F3 0%, #E8EFF4 100%)' },
  { value: 'linear-gradient(135deg, #C8D9E6 0%, #9BB8CE 100%)' },
  { value: 'linear-gradient(135deg, #9BB8CE 0%, #8A9A9D 100%)' },
  { value: 'linear-gradient(135deg, #F8F6F3 0%, #9BB8CE 100%)' },
  { value: 'linear-gradient(135deg, #C8D9E6 0%, #E8EFF4 100%)' }
]

onMounted(() => {
  loadGallery()
})

const loadGallery = () => {
  galleryItems.value = getGalleryItems()
}

const openModal = () => {
  showModal.value = true
  editingItem.value = null
  resetForm()
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
  resetForm()
}

const resetForm = () => {
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
}

const getItemPreviewStyle = (item) => {
  if (item.type === 'image') {
    return { background: '#f5f5f5' }
  }
  return { background: item.gradient }
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
  showModal.value = true
}

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    itemForm.value.image = e.target.result
  }
  reader.readAsDataURL(file)
}

const removeImage = () => {
  itemForm.value.image = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
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
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  font-weight: 400;
}

.btn-primary {
  padding: 12px 25px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
}

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
}

.edit-btn {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.delete-btn {
  background: #ffebee;
  color: #e57373;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--浅雾);
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--浅青灰);
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
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.type-btn {
  padding: 15px;
  background: var(--浅雾);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-btn.active {
  border-color: var(--浅青灰);
  background: var(--霜蓝);
}

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
  border: 2px solid transparent;
}

.gradient-option.active {
  border-color: var(--浅青灰);
}

.upload-preview {
  position: relative;
  margin-top: 10px;
}

.upload-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 10px;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
}

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
  cursor: pointer;
}

.btn-cancel {
  background: var(--浅雾);
  color: var(--浅青灰);
}

.btn-save {
  background: var(--浅青灰);
  color: var(--米白);
}
</style>
