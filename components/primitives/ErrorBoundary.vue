<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary__content">
      <div class="error-boundary__icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      
      <div class="error-boundary__text">
        <h3 class="error-boundary__title">{{ title }}</h3>
        <p class="error-boundary__message">{{ message }}</p>
        
        <details v-if="showDetails && error" class="error-boundary__details">
          <summary>Error details</summary>
          <pre class="error-boundary__stack">{{ error.stack }}</pre>
        </details>
      </div>

      <div class="error-boundary__actions">
        <button 
          type="button" 
          class="error-boundary__button error-boundary__button--retry"
          @click="handleRetry"
        >
          Try again
        </button>
        <button 
          v-if="showReset" 
          type="button" 
          class="error-boundary__button error-boundary__button--reset"
          @click="handleReset"
        >
          Reset form
        </button>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, type Ref } from 'vue';

export interface ErrorBoundaryProps {
  /** Error boundary title */
  title?: string;
  /** Error message text */
  message?: string;
  /** Show error details expander */
  showDetails?: boolean;
  /** Show reset button */
  showReset?: boolean;
  /** Custom error handler callback */
  onError?: (error: Error, instance: any, info: string) => void;
}

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  showDetails: false,
  showReset: true
});

const emit = defineEmits<{
  error: [error: Error, instance: any, info: string];
  retry: [];
  reset: [];
}>();

const hasError = ref(false);
const error: Ref<Error | null> = ref(null);

const handleError = (error: unknown) => {
  // Client-side error logging - console is acceptable in browser
  if (import.meta.dev) {
    console.error('ErrorBoundary caught an error:', error);
  }
};

onErrorCaptured((err: Error, instance: any, info: string) => {
  handleError(err);
  
  hasError.value = true;
  error.value = err;
  
  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, instance, info);
  }
  
  // Emit error event for parent components
  emit('error', err, instance, info);
  
  // Prevent error from propagating further
  return false;
});

const handleRetry = () => {
  hasError.value = false;
  error.value = null;
  emit('retry');
};

const handleReset = () => {
  hasError.value = false;
  error.value = null;
  emit('reset');
};

// Expose methods for programmatic reset
defineExpose({
  reset: handleReset,
  retry: handleRetry
});
</script>

<style scoped>
.error-boundary {
  padding: var(--space-5);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.error-boundary__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: flex-start;
}

.error-boundary__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--space-12);
  height: var(--space-12);
  border-radius: var(--radius-md);
  background: var(--color-danger);
  color: var(--color-white);
}

.error-boundary__text {
  flex: 1;
}

.error-boundary__title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-danger);
}

.error-boundary__message {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.5;
}

.error-boundary__details {
  margin-top: var(--space-3);
}

.error-boundary__details summary {
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-2);
}

.error-boundary__stack {
  margin: var(--space-2) 0 0 0;
  padding: var(--space-3);
  background: var(--color-overlay-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.error-boundary__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.error-boundary__button {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-white);
  color: var(--color-danger);
}

.error-boundary__button:hover {
  background: var(--color-danger);
  color: var(--color-white);
}

.error-boundary__button--retry {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.error-boundary__button--retry:hover {
  background: var(--color-primary);
  color: var(--color-white);
}
</style>
