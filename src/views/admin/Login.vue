<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <span class="login-icon">🌲</span>
          <h1 class="login-title">后台管理</h1>
          <p class="login-subtitle">请输入密码登录</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="form-input"
            />
          </div>

          <p v-if="error" class="error-message">{{ error }}</p>

          <button type="submit" class="login-btn">
            <span>登录</span>
            <span class="btn-arrow">→</span>
          </button>
        </form>

        <div class="login-hint">
          <p>默认密码：admin123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../utils/storage'

const router = useRouter()
const password = ref('')
const error = ref('')

const handleLogin = () => {
  error.value = ''

  if (!password.value) {
    error.value = '请输入密码'
    return
  }

  if (login(password.value)) {
    router.push('/admin/dashboard')
  } else {
    error.value = '密码错误'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 50px 40px;
  box-shadow: 0 20px 60px rgba(200, 217, 230, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.login-title {
  font-size: 2rem;
  font-weight: 300;
  color: var(--浅青灰);
  letter-spacing: 0.3rem;
  margin-bottom: 10px;
}

.login-subtitle {
  color: var(--深霜蓝);
  font-size: 0.9rem;
  font-weight: 200;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  font-size: 0.85rem;
  color: var(--浅青灰);
  letter-spacing: 0.1rem;
  font-weight: 200;
}

.form-input {
  padding: 15px 20px;
  border: 1px solid var(--霜蓝);
  border-radius: 15px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-dark);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--深霜蓝);
  background: white;
  box-shadow: 0 0 0 3px rgba(200, 217, 230, 0.2);
}

.form-input::placeholder {
  color: var(--text-light);
  font-weight: 200;
}

.error-message {
  color: #e57373;
  font-size: 0.85rem;
  text-align: center;
  font-weight: 200;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px;
  background: var(--浅青灰);
  color: var(--米白);
  border: none;
  border-radius: 15px;
  font-size: 1rem;
  letter-spacing: 0.15rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.login-btn:hover {
  background: var(--text-dark);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(138, 154, 157, 0.3);
}

.btn-arrow {
  transition: transform 0.3s ease;
}

.login-btn:hover .btn-arrow {
  transform: translateX(5px);
}

.login-hint {
  margin-top: 30px;
  text-align: center;
}

.login-hint p {
  color: var(--text-light);
  font-size: 0.85rem;
  font-weight: 200;
}
</style>
