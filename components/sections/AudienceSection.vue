<template>
  <section class="audience-section">
    <h2 class="audience-section__title">Work your way</h2>
    <p class="audience-section__subtitle">Flexible opportunities for every stage of life</p>
    
    <div class="audience-section__grid">
      <div class="audience-card">
        <span class="audience-card__icon">🎓</span>
        <span class="audience-card__label">Students</span>
        <span class="audience-card__description">Flexible jobs around study</span>
      </div>
      <div class="audience-card">
        <span class="audience-card__icon">👵</span>
        <span class="audience-card__label">Retired</span>
        <span class="audience-card__description">Stay active & earn</span>
      </div>
      <div class="audience-card">
        <span class="audience-card__icon">👨‍👩‍👧</span>
        <span class="audience-card__label">Parents</span>
        <span class="audience-card__description">Work around family</span>
      </div>
      <div class="audience-card">
        <span class="audience-card__icon">🌍</span>
        <span class="audience-card__label">New to UK</span>
        <span class="audience-card__description">Build local experience</span>
      </div>
      <div class="audience-card">
        <span class="audience-card__icon">💼</span>
        <span class="audience-card__label">Professionals</span>
        <span class="audience-card__description">Freelance & skilled work</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Audience targeting section
</script>

<style scoped>
.audience-section {
  margin-top: var(--space-8);
  text-align: center;
}

.audience-section__title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  margin-bottom: var(--space-1);
}

.audience-section__subtitle {
  color: var(--color-text-subtle);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
}

.audience-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
}

.audience-card {
  background: var(--color-surface);
  padding: var(--space-5);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  font-size: var(--text-base);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  transition: transform 0.2s ease;
}

.audience-card:hover {
  transform: translateY(-4px);
}

.audience-card__icon {
  font-size: 32px;
}

.audience-card__label {
  font-family: var(--font-display);
  font-weight: 600;
}

.audience-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

@media (max-width: 768px) {
  .audience-section__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
