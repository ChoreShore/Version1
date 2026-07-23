<script setup lang="ts">
export interface InfoBadgeProps {
  /** Badge text label */
  label?: string;
  /** Visual style variant */
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

const props = withDefaults(defineProps<InfoBadgeProps>(), {
  variant: 'neutral'
});

const classes = computed(() => ['info-badge', `variant-${props.variant}`]);
</script>

<template>
  <span :class="classes">
    <slot>{{ label }}</slot>
  </span>
</template>

<style scoped>
.info-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0 var(--space-2);
  height: 28px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  background-color: var(--color-hover);
  color: var(--color-text);
}

.variant-info {
  background-color: var(--color-hover);
  color: var(--color-text);
}

.variant-success {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.variant-warning {
  background-color: var(--color-warning-bg);
  color: var(--color-warning-text);
}

.variant-danger {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}
</style>
