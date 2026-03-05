<template>
  <section class="stat-card">
    <div class="stat-card__header">
      <p class="stat-card__title">{{ title }}</p>
      <slot name="icon">
        <span v-if="icon" class="stat-card__icon" aria-hidden="true">{{ icon }}</span>
      </slot>
    </div>

    <p class="stat-card__value">{{ value }}</p>

    <p v-if="description" class="stat-card__description">{{ description }}</p>

    <div v-if="trend" class="stat-card__trend" :class="trend.variant">
      <span aria-hidden="true">{{ trend.variant === 'up' ? '▲' : '▼' }}</span>
      <span class="stat-card__trend-value">{{ trend.value }}</span>
      <span class="stat-card__trend-label">{{ trend.label }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: { value: string; label?: string; variant?: 'up' | 'down' };
}>();

const trendVariant = computed(() => props.trend?.variant ?? 'up');
</script>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.stat-card__title {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card__icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stat-card__value {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.stat-card__description {
  margin: 0;
  color: var(--color-text-muted);
}

.stat-card__trend {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.stat-card__trend.up {
  color: var(--color-success);
}

.stat-card__trend.down {
  color: var(--color-danger);
}

.stat-card__trend-label {
  font-weight: 400;
  color: var(--color-text-muted);
}
</style>
