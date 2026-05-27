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
  background-color: var(--hover);
  color: var(--text);
}

.variant-info {
  background-color: var(--color-hover);
  color: var(--color-text);
}

.variant-success {
  background-color: rgba(17, 17, 17, 0.12);
  color: var(--success);
}

.variant-warning {
  background-color: rgba(212, 116, 94, 0.15);
  color: var(--accent);
}

.variant-danger {
  background-color: rgba(192, 57, 43, 0.12);
  color: var(--color-danger);
}
</style>
