<script setup lang="ts">
export interface StatusPillProps {
  /** Pill text label */
  label?: string;
  /** Visual style variant */
  variant?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

withDefaults(defineProps<StatusPillProps>(), {
  variant: 'neutral'
});
</script>

<template>
  <span class="status-pill" :class="[`status-${variant}`]">
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--color-hover);
  color: var(--color-text-muted);
}

.status-info {
  background: var(--color-hover);
  color: var(--color-text);
}

.status-success {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.status-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
</style>
