<template>
  <section class="trust-section">
    <div class="trust-section__grid">
      <div class="trust-item">
        <div class="trust-item__icon">⭐</div>
        <h4>Rated workers</h4>
        <p>Real reviews from real employers</p>
      </div>
      <div class="trust-item">
        <div class="trust-item__icon">✔</div>
        <h4>Verified profiles</h4>
        <p>ID and RTW verification</p>
      </div>
      <div class="trust-item">
        <div class="trust-item__icon">⚡</div>
        <h4>Fast hiring</h4>
        <p>Connect and hire quickly</p>
      </div>
      <div class="trust-item">
        <div class="trust-item__icon">💬</div>
        <h4>Direct messaging</h4>
        <p>Chat directly with workers</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Trust badges section
</script>

<style scoped>
.trust-section {
  margin-top: var(--space-8);
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  text-align: center;
}

.trust-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.trust-item {
  background: var(--color-surface-muted);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease;
}

.trust-item:hover {
  transform: translateY(-4px);
  background: var(--color-surface-hover);
}

.trust-item__icon {
  font-size: 32px;
  margin-bottom: var(--space-2);
}

.trust-item h4 {
  font-family: var(--font-display);
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-base);
}

.trust-item p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
  font-weight: 400;
}

@media (max-width: 768px) {
  .trust-section__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
