<template>
  <div class="about-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">关于</h1>
        <p class="page-subtitle">关于我 · 关于这里</p>
        <div class="header-divider"></div>
      </div>
    </div>

    <div class="about-container">
      <!-- 个人介绍 -->
      <section class="about-section">
        <div class="section-content">
          <div class="profile-card">
            <div class="profile-image">
              <span class="profile-icon">🌲</span>
            </div>
            <h2 class="profile-name">義</h2>
            <p class="profile-title">XIA RUIDONG</p>
            <p class="profile-bio">
              喜欢在冬日里看雪，在文字间取暖。<br>
              这里是我的小小花园，种着一些文字与碎片。<br>
              愿你在这里找到片刻的宁静。
            </p>
          </div>
        </div>
      </section>

      <!-- 时间线 -->
      <section class="timeline-section">
        <h2 class="section-title">成长轨迹</h2>
        <div class="timeline">
          <div class="timeline-item" v-for="item in timeline" :key="item.year">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <span class="timeline-year">{{ item.year }}</span>
              <h3 class="timeline-title">{{ item.title }}</h3>
              <p class="timeline-description">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 技能与兴趣 -->
      <section class="skills-section">
        <h2 class="section-title">技能与兴趣</h2>
        <div class="skills-grid">
          <div class="skill-category" v-for="category in skills" :key="category.name">
            <div class="skill-icon">{{ category.icon }}</div>
            <h3 class="skill-name">{{ category.name }}</h3>
            <ul class="skill-list">
              <li v-for="skill in category.items" :key="skill">{{ skill }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 联系方式 -->
      <section class="contact-section">
        <h2 class="section-title">保持联系</h2>
        <div class="contact-grid">
          <a
            v-for="contact in contacts"
            :key="contact.name"
            :href="contact.link"
            class="contact-card"
            target="_blank"
          >
            <span class="contact-icon">{{ contact.icon }}</span>
            <span class="contact-name">{{ contact.name }}</span>
            <span class="contact-handle">{{ contact.handle }}</span>
          </a>
        </div>
      </section>

      <!-- 致谢 -->
      <section class="thanks-section">
        <div class="thanks-content">
          <span class="thanks-icon">🙏</span>
          <p class="thanks-text">
            感谢你来到这里，<br>
            愿我们都能在喧嚣的世界中，<br>
            找到属于自己的宁静角落。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const timeline = ref([
  {
    year: '2024',
    title: '开启博客之旅',
    description: '开始记录生活与思考，建立了这个小小的个人空间。'
  },
  {
    year: '2023',
    title: '深入探索',
    description: '在技术与人文的交叉点上探索，寻找平衡与答案。'
  },
  {
    year: '2022',
    title: '初识编程',
    description: '开始接触编程，发现了代码之美。'
  },
  {
    year: '2021',
    title: '大学毕业',
    description: '完成学业，踏入社会，开始了人生的新篇章。'
  }
])

const skills = ref([
  {
    icon: '💻',
    name: '技术',
    items: ['前端开发', 'Vue.js', 'JavaScript', 'UI/UX 设计']
  },
  {
    icon: '📖',
    name: '阅读',
    items: ['文学', '哲学', '科技', '设计']
  },
  {
    icon: '🌿',
    name: '兴趣',
    items: ['摄影', '写作', '徒步', '茶道']
  },
  {
    icon: '✨',
    name: '追求',
    items: ['简约', '宁静', '成长', '分享']
  }
])

const contacts = ref([
  {
    icon: '📧',
    name: 'Email',
    handle: '776363928@qq.com',
    link: 'mailto:776363928@qq.com'
  },
  {
    icon: '🐦',
    name: '微博',
    handle: '@義7011',
    link: '#'
  },
  {
    icon: '📕',
    name: '小红书',
    handle: '@義0416',
    link: '#'
  },
  {
    icon: '🐙',
    name: 'GitHub',
    handle: '@Xiaruidong',
    link: '#'
  }
])
</script>

<style scoped>
.about-page {
  padding-top: 120px;
  min-height: 100vh;
  padding-bottom: 60px;
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

/* About Container */
.about-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 30px;
}

/* About Section */
.about-section {
  margin-bottom: 80px;
}

.profile-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(200, 217, 230, 0.15);
}

.profile-image {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, var(--霜蓝), var(--深霜蓝));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
}

.profile-icon {
  font-size: 4rem;
}

.profile-name {
  font-size: 2rem;
  color: var(--text-dark);
  margin-bottom: 10px;
  font-weight: 300;
  letter-spacing: 0.3rem;
}

.profile-title {
  font-size: 0.9rem;
  color: var(--深霜蓝);
  letter-spacing: 0.3rem;
  margin-bottom: 25px;
  font-weight: 200;
}

.profile-bio {
  color: var(--text-light);
  line-height: 2;
  font-size: 1.05rem;
  font-weight: 200;
}

/* Section Title */
.section-title {
  text-align: center;
  font-size: 1.5rem;
  color: var(--浅青灰);
  letter-spacing: 0.3rem;
  margin-bottom: 40px;
  font-weight: 300;
}

/* Timeline Section */
.timeline-section {
  margin-bottom: 80px;
}

.timeline {
  position: relative;
  padding-left: 40px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--霜蓝), var(--深霜蓝));
}

.timeline-item {
  position: relative;
  padding-bottom: 40px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: -46px;
  top: 5px;
  width: 14px;
  height: 14px;
  background: var(--柔白);
  border: 3px solid var(--霜蓝);
  border-radius: 50%;
}

.timeline-content {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 15px;
  padding: 25px;
  transition: all 0.3s ease;
}

.timeline-content:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateX(10px);
}

.timeline-year {
  display: inline-block;
  padding: 5px 15px;
  background: var(--浅雾);
  border-radius: 15px;
  font-size: 0.85rem;
  color: var(--深霜蓝);
  margin-bottom: 12px;
  font-weight: 200;
}

.timeline-title {
  font-size: 1.2rem;
  color: var(--text-dark);
  margin-bottom: 10px;
  font-weight: 400;
}

.timeline-description {
  color: var(--text-light);
  line-height: 1.8;
  font-size: 0.95rem;
  font-weight: 200;
}

/* Skills Section */
.skills-section {
  margin-bottom: 80px;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
}

.skill-category {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px 25px;
  text-align: center;
  transition: all 0.3s ease;
}

.skill-category:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(200, 217, 230, 0.2);
}

.skill-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.skill-name {
  font-size: 1.1rem;
  color: var(--text-dark);
  margin-bottom: 15px;
  font-weight: 400;
}

.skill-list {
  list-style: none;
  padding: 0;
}

.skill-list li {
  color: var(--text-light);
  padding: 5px 0;
  font-size: 0.9rem;
  font-weight: 200;
}

/* Contact Section */
.contact-section {
  margin-bottom: 80px;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.contact-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.contact-card:hover {
  background: var(--浅雾);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(200, 217, 230, 0.25);
}

.contact-icon {
  font-size: 2.5rem;
}

.contact-name {
  color: var(--text-dark);
  font-size: 1rem;
  font-weight: 400;
}

.contact-handle {
  color: var(--text-light);
  font-size: 0.85rem;
  font-weight: 200;
}

/* Thanks Section */
.thanks-section {
  margin-bottom: 40px;
}

.thanks-content {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, rgba(232, 239, 244, 0.5), rgba(200, 217, 230, 0.3));
  border-radius: 30px;
}

.thanks-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.thanks-text {
  color: var(--浅青灰);
  line-height: 2;
  font-size: 1.1rem;
  font-weight: 200;
  letter-spacing: 0.1rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .about-page {
    padding-top: 100px;
  }

  .profile-card {
    padding: 40px 30px;
  }

  .profile-name {
    font-size: 1.6rem;
    letter-spacing: 0.2rem;
  }

  .timeline {
    padding-left: 30px;
  }

  .timeline-dot {
    left: -36px;
  }

  .skills-grid,
  .contact-grid {
    grid-template-columns: 1fr;
  }

  .thanks-content {
    padding: 40px 25px;
  }
}
</style>
