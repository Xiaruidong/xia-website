<template>
  <div class="post-edit">
    <div class="page-header">
      <button @click="$router.back()" class="back-btn">← 返回</button>
      <h2 class="page-title">{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <div class="header-actions">
        <button @click="savePost" class="btn-save">保存</button>
      </div>
    </div>

    <form @submit.prevent="savePost" class="edit-form">
      <div class="form-section">
        <h3 class="section-title">基本信息</h3>

        <div class="form-group">
          <label for="title">文章标题 *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="请输入文章标题"
            required
            class="form-input"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="category">分类</label>
            <select id="category" v-model="form.categoryId" class="form-select">
              <option value="life">生活</option>
              <option value="thinking">思考</option>
              <option value="reading">读书</option>
              <option value="tech">技术</option>
            </select>
          </div>

          <div class="form-group">
            <label for="date">发布日期</label>
            <input
              id="date"
              v-model="form.date"
              type="date"
              class="form-input"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="excerpt">摘要 *</label>
          <textarea
            id="excerpt"
            v-model="form.excerpt"
            placeholder="请输入文章摘要"
            required
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>

        <div class="form-group">
          <label>标签</label>
          <div class="tags-input">
            <span
              v-for="(tag, index) in form.tags"
              :key="index"
              class="tag-item"
            >
              {{ tag }}
              <button type="button" @click="removeTag(index)" class="tag-remove">×</button>
            </span>
            <input
              v-model="newTag"
              @keyup.enter="addTag"
              placeholder="输入标签后按回车添加"
              class="tag-input"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3 class="section-title">文章内容</h3>

        <!-- 编辑工具栏 -->
        <div class="editor-toolbar">
          <button type="button" @click="insertFormat('h3')" class="toolbar-btn">标题</button>
          <button type="button" @click="insertFormat('bold')" class="toolbar-btn">加粗</button>
          <button type="button" @click="insertFormat('italic')" class="toolbar-btn">斜体</button>
          <button type="button" @click="insertFormat('quote')" class="toolbar-btn">引用</button>
          <button type="button" @click="insertFormat('link')" class="toolbar-btn">链接</button>
        </div>

        <div class="form-group">
          <textarea
            v-model="form.content"
            placeholder="支持 HTML 标签，如 &lt;h3&gt;标题&lt;/h3&gt;、&lt;p&gt;段落&lt;/p&gt;、&lt;blockquote&gt;引用&lt;/blockquote&gt; 等"
            rows="20"
            class="form-textarea code-textarea"
          ></textarea>
        </div>

        <div class="content-preview">
          <h4>预览</h4>
          <div class="preview-content" v-html="form.content"></div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPosts, addPost, updatePost } from '../../utils/storage'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => route.params.id !== 'new')
const postId = computed(() => parseInt(route.params.id))

const form = ref({
  title: '',
  excerpt: '',
  content: '',
  category: '',
  categoryId: 'life',
  date: '',
  tags: []
})

const newTag = ref('')

onMounted(() => {
  if (isEdit.value) {
    const post = getPosts().find(p => p.id === postId.value)
    if (post) {
      form.value = {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        categoryId: post.categoryId,
        date: post.date,
        tags: post.tags || []
      }
    }
  } else {
    // 设置默认日期为今天
    const today = new Date()
    form.value.date = today.toISOString().split('T')[0]
  }
})

const addTag = () => {
  if (newTag.value.trim() && !form.value.tags.includes(newTag.value.trim())) {
    form.value.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index) => {
  form.value.tags.splice(index, 1)
}

const insertFormat = (type) => {
  const textarea = document.querySelector('.code-textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = form.value.content
  const before = text.substring(0, start)
  const after = text.substring(end)
  const selection = text.substring(start, end)

  let insert = ''
  switch (type) {
    case 'h3':
      insert = '<h3>' + (selection || '标题') + '</h3>'
      break
    case 'bold':
      insert = '<strong>' + (selection || '加粗文本') + '</strong>'
      break
    case 'italic':
      insert = '<em>' + (selection || '斜体文本') + '</em>'
      break
    case 'quote':
      insert = '<blockquote>' + (selection || '引用内容') + '</blockquote>'
      break
    case 'link':
      insert = '<a href="#">' + (selection || '链接文本') + '</a>'
      break
  }

  form.value.content = before + insert + after
  textarea.focus()
}

const savePost = () => {
  if (!form.value.title || !form.value.excerpt) {
    alert('请填写必填项')
    return
  }

  const categoryMap = {
    life: { name: '生活', color: 'linear-gradient(135deg, #E8EFF4 0%, #C8D9E6 100%)' },
    thinking: { name: '思考', color: 'linear-gradient(135deg, #F8F6F3 0%, #E8EFF4 100%)' },
    reading: { name: '读书', color: 'linear-gradient(135deg, #C8D9E6 0%, #9BB8CE 100%)' },
    tech: { name: '技术', color: 'linear-gradient(135deg, #9BB8CE 0%, #8A9A9D 100%)' }
  }

  const categoryInfo = categoryMap[form.value.categoryId]
  const postData = {
    title: form.value.title,
    excerpt: form.value.excerpt,
    content: form.value.content,
    category: categoryInfo.name,
    categoryId: form.value.categoryId,
    date: form.value.date,
    color: categoryInfo.color,
    readTime: Math.max(1, Math.ceil(form.value.content.split('').length / 500)) + ' min',
    views: 0,
    tags: form.value.tags
  }

  if (isEdit.value) {
    updatePost(postId.value, postData)
  } else {
    addPost(postData)
  }

  router.push('/admin/posts')
}
</script>

<style scoped>
.post-edit {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  padding: 10px 20px;
  background: var(--浅雾);
  border: none;
  border-radius: 15px;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

.page-title {
  font-size: 1.5rem;
  color: var(--浅青灰);
  font-weight: 400;
  letter-spacing: 0.2rem;
}

.btn-save {
  padding: 12px 30px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 15px;
  font-size: 0.9rem;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(138, 154, 157, 0.3);
}

/* Form */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.form-section {
  background: var(--柔白);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(200, 217, 230, 0.15);
}

.section-title {
  font-size: 1.1rem;
  color: var(--浅青灰);
  margin-bottom: 20px;
  font-weight: 400;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  font-size: 0.9rem;
  color: var(--浅青灰);
  font-weight: 200;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 18px;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  font-size: 0.95rem;
  background: white;
  color: var(--text-dark);
  font-family: inherit;
  transition: all 0.3s ease;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.code-textarea {
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.6;
  font-size: 0.9rem;
}

/* Tags Input */
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: white;
  border: 1px solid var(--霜蓝);
  border-radius: 12px;
  min-height: 50px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: var(--浅雾);
  border-radius: 15px;
  font-size: 0.85rem;
  color: var(--浅青灰);
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--深霜蓝);
  padding: 0;
  line-height: 1;
}

.tag-input {
  flex: 1;
  min-width: 150px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.9rem;
  padding: 5px;
}

/* Editor Toolbar */
.editor-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 8px 16px;
  background: var(--浅雾);
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  color: var(--浅青灰);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toolbar-btn:hover {
  background: var(--霜蓝);
  color: var(--米白);
}

/* Content Preview */
.content-preview {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--浅雾);
}

.content-preview h4 {
  color: var(--浅青灰);
  margin-bottom: 15px;
  font-size: 1rem;
}

.preview-content {
  background: white;
  padding: 25px;
  border-radius: 15px;
  border: 1px solid var(--浅雾);
  min-height: 200px;
}

.preview-content :deep(h3) {
  font-size: 1.4rem;
  color: var(--text-dark);
  margin: 1.5rem 0 1rem;
}

.preview-content :deep(p) {
  line-height: 1.8;
  margin-bottom: 1rem;
  color: var(--text-dark);
}

.preview-content :deep(blockquote) {
  border-left: 3px solid var(--霜蓝);
  padding-left: 20px;
  margin: 1.5rem 0;
  color: var(--text-light);
  font-style: italic;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .form-section {
    padding: 20px;
  }
}
</style>
