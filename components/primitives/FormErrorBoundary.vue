<template>
  <ErrorBoundary
    :title="title"
    :message="message"
    :show-details="showDetails"
    :show-reset="showReset"
    @error="handleError"
    @retry="handleRetry"
    @reset="handleReset"
  >
    <template #default>
      <slot />
    </template>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from './ErrorBoundary.vue';

interface FormErrorBoundaryProps {
  title?: string;
  message?: string;
  showDetails?: boolean;
  showReset?: boolean;
  formName?: string;
}

const props = withDefaults(defineProps<FormErrorBoundaryProps>(), {
  title: 'Form error',
  message: 'The form encountered an error. Your data may not have been saved.',
  showDetails: false,
  showReset: true
});

const emit = defineEmits<{
  'form-error': [error: Error, formName?: string];
  retry: [];
  reset: [];
}>();

const handleError = (error: Error, instance: any, info: string) => {
  // Log form-specific errors
  console.error(`Form Error Boundary (${props.formName || 'unknown'}):`, error);
  
  // Emit form-specific error event
  emit('form-error', error, props.formName);
  
  // You could also send error reports to your monitoring service here
  // reportError(error, { formName: props.formName, component: info });
};

const handleRetry = () => {
  emit('retry');
};

const handleReset = () => {
  emit('reset');
};
</script>
