<script setup lang="ts">
export interface StatCardProps {
  /** Card title / label */
  title: string;
  /** Main numeric or text value */
  value: string | number;
  /** Optional description */
  description?: string;
  /** Icon emoji or character */
  icon?: string;
  /** Trend indicator */
  trend?: { value: string; label?: string; variant?: 'up' | 'down' };
}

const props = defineProps<StatCardProps>();

const trendVariant = computed(() => props.trend?.variant ?? 'up');
</script>

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
  width: var(--space-8);
  height: var(--space-8);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-hover), var(--color-white));
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.stat-card__value {
  margin: 0;
  font-size: var(--text-3xl);
  font-weight: 600;
}

.stat-card__description {
  margin: 0;
  color: var(--color-text-muted);
}

.stat-card__trend {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-1);
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
