<template>
  <section class="earning-section">
    <h2 class="earning-section__title">💸 Start earning today</h2>
    <div class="earning-section__grid">
      <div class="earning-card">
        <span class="earning-card__icon">🧹</span>
        <span class="earning-card__label">Cleaning</span>
        <span class="earning-card__rate">£12–£18/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">🚚</span>
        <span class="earning-card__label">Moving</span>
        <span class="earning-card__rate">£14–£20/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">💻</span>
        <span class="earning-card__label">Remote</span>
        <span class="earning-card__rate">£15–£30/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">🔧</span>
        <span class="earning-card__label">Handyman</span>
        <span class="earning-card__rate">£18–£35/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">🐾</span>
        <span class="earning-card__label">Pet Care</span>
        <span class="earning-card__rate">£10–£16/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">🤝</span>
        <span class="earning-card__label">Care Support</span>
        <span class="earning-card__rate">£14–£22/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">🎨</span>
        <span class="earning-card__label">Creative</span>
        <span class="earning-card__rate">£20–£50/hr</span>
      </div>
      <div class="earning-card">
        <span class="earning-card__icon">📦</span>
        <span class="earning-card__label">Delivery</span>
        <span class="earning-card__rate">£10–£18/hr</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Earning potential section
</script>

<style scoped>
.earning-section {
  margin-top: var(--space-8);
  background: var(--color-surface);
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  text-align: center;
}

.earning-section__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-5);
}

.earning-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.earning-card {
  background: var(--color-surface-muted);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  transition: transform 0.2s ease, background 0.2s ease;
}

.earning-card:hover {
  transform: translateY(-4px);
  background: var(--color-surface-hover);
}

.earning-card__icon {
  font-size: 32px;
}

.earning-card__label {
  font-family: var(--font-display);
  font-size: var(--text-base);
}

.earning-card__rate {
  font-size: var(--text-sm);
  color: var(--color-primary-600);
  font-weight: 700;
}

@media (max-width: 768px) {
  .earning-section__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
