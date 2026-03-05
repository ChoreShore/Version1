<template>
  <span class="status-pill" :class="[`status-${variant}`]">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  }>(),
  {
    variant: 'neutral'
  }
);
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.status-info {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.status-success {
  background: rgba(15, 157, 88, 0.12);
  color: var(--color-success);
}

.status-warning {
  background: rgba(245, 158, 11, 0.18);
  color: var(--color-warning);
}

.status-danger {
  background: rgba(217, 48, 37, 0.15);
  color: var(--color-danger);
}
</style>
