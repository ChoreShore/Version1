<script setup lang="ts">
export interface ButtonProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  loading: false,
  disabled: false,
  type: 'button'
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const isDisabled = computed(() => props.disabled || props.loading);

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  {
    'btn--full-width': props.fullWidth,
    'btn--loading': props.loading
  }
]);

function handleClick(event: MouseEvent) {
  if (!isDisabled.value) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :class="classes"
    :disabled="isDisabled"
    :type="type"
    :aria-busy="loading"
    @click="handleClick"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <span class="btn__label">
      <slot />
    </span>
  </button>
</template>

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
  color: var(--color-white);
}

.btn--primary:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.btn--secondary {
  background: var(--color-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn--ghost {
  background: transparent;
  color: var(--color-text);
}

.btn--ghost:hover:not(:disabled) {
  background: var(--color-hover);
}

.btn--danger {
  background: var(--color-error);
  color: var(--color-white);
}

.btn--danger:hover:not(:disabled) {
  background: var(--color-error);
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

.btn--full-width {
  width: 100%;
}

.btn--loading {
  position: relative;
}

.btn--loading .btn__label {
  opacity: 0;
}

.btn__spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 600ms linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
