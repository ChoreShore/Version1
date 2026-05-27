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
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--hover);
  color: var(--muted);
}

.status-info {
  background: var(--color-hover);
  color: var(--color-text);
}

.status-success {
  background: rgba(17, 17, 17, 0.12);
  color: var(--success);
}

.status-warning {
  background: rgba(212, 116, 94, 0.15);
  color: #A8553D;
}

.status-danger {
  background: rgba(192, 57, 43, 0.12);
  color: var(--color-danger);
}
</style>
