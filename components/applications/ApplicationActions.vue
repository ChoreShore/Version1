<template>
  <div class="application-actions">
    <button
      type="button"
      class="application-actions__button application-actions__button--pending"
      :disabled="disabled || application.status === 'pending'"
      @click="handleAction('pending')"
    >
      Move to pending
    </button>
    <button
      type="button"
      class="application-actions__button application-actions__button--success"
      :disabled="disabled || application.status === 'accepted'"
      @click="handleAction('accepted')"
    >
      Accept
    </button>
    <button
      type="button"
      class="application-actions__button application-actions__button--danger"
      :disabled="disabled || application.status === 'rejected'"
      @click="handleAction('rejected')"
    >
      Reject
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ApplicationStatus, ApplicationWithDetails } from '~/schemas/application';

const props = defineProps<{
  application: ApplicationWithDetails;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  action: [applicationId: string, status: ApplicationStatus];
}>();

const handleAction = (status: ApplicationStatus) => {
  emit('action', props.application.id, status);
};
</script>

<style scoped>
.application-actions {
  display: inline-flex;
  gap: var(--space-2);
}

.application-actions__button {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-surface);
  color: var(--color-text);
}

.application-actions__button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.application-actions__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.application-actions__button--pending {
  border-color: var(--color-info);
  color: var(--color-info);
}

.application-actions__button--pending:hover:not(:disabled) {
  background: var(--color-info);
  color: white;
}

.application-actions__button--success {
  border-color: var(--color-success);
  color: var(--color-success);
}

.application-actions__button--success:hover:not(:disabled) {
  background: var(--color-success);
  color: white;
}

.application-actions__button--danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.application-actions__button--danger:hover:not(:disabled) {
  background: var(--color-danger);
  color: white;
}
</style>
