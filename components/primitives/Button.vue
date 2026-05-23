<template>
  <button
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--disabled': disabled }]"
    :disabled="disabled"
    type="button"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false
  }
);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms ease;
  text-decoration: none;
}

.btn:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 3px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.btn--primary {
  background: var(--color-primary-600);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.btn--secondary {
  background: var(--hover);
  color: var(--color-text);
  border: 1px solid var(--border);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--border);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--hover);
}

.btn--danger {
  background: var(--color-error);
  color: white;
}

.btn--danger:hover:not(:disabled) {
  background: #C53030;
}

/* Sizes */
.btn--sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}

.btn--md {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
}

.btn--lg {
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-lg);
}
</style>
