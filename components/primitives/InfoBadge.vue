<template>
  <span class="info-badge" :class="`variant-${variant}`">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  }>(),
  {
    variant: 'neutral'
  }
);
</script>

<style scoped>
.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 var(--space-2);
  height: 28px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  background-color: var(--color-surface-muted);
  color: var(--color-text);
}

.variant-info {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.variant-success {
  background-color: rgba(15, 157, 88, 0.12);
  color: var(--color-success);
}

.variant-warning {
  background-color: rgba(245, 158, 11, 0.15);
  color: var(--color-warning);
}

.variant-danger {
  background-color: rgba(217, 48, 37, 0.12);
  color: var(--color-danger);
}
</style>
