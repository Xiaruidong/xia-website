<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-links">
        <a href="mailto:hello@xia.com" class="footer-link">
          <span class="link-icon">📧</span>
          <span>Email</span>
        </a>
        <a href="#" class="footer-link">
          <span class="link-icon">🐦</span>
          <span>微博</span>
        </a>
        <a href="#" class="footer-link">
          <span class="link-icon">📕</span>
          <span>Instagram</span>
        </a>
        <a href="#" class="footer-link">
          <span class="link-icon">🐙</span>
          <span>GitHub</span>
        </a>
      </div>

      <div class="footer-divider"></div>

      <p class="footer-text">© 2026 義 · 静谧如雪</p>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  position: relative;
  z-index: 2;
  padding: 40px 0 30px;
  background: linear-gradient(to top, rgba(232, 239, 244, 0.5), transparent);
}

.footer-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 30px;
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--柔白);
  border-radius: 25px;
  color: var(--浅青灰);
  font-size: 0.85rem;
  letter-spacing: 0.1rem;
  transition: all 0.3s ease;
}

.footer-link:hover {
  background: var(--浅雾);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(200, 217, 230, 0.25);
  color: var(--深霜蓝);
}

.link-icon {
  font-size: 1.1rem;
}

.footer-divider {
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--霜蓝), transparent);
  margin: 0 auto 20px;
}

.footer-text {
  color: var(--深霜蓝);
  font-size: 0.85rem;
  font-weight: 200;
  letter-spacing: 0.15rem;
}

@media (max-width: 600px) {
  .footer-links {
    gap: 15px;
  }

  .footer-link {
    padding: 8px 15px;
    font-size: 0.8rem;
  }
}
</style>
