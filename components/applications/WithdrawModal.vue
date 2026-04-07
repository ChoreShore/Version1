<template>
  <div class="withdraw-modal__overlay" @click.self="emit('cancel')">
    <div class="withdraw-modal" role="dialog" aria-modal="true" aria-labelledby="withdraw-modal-title">
      <header class="withdraw-modal__header">
        <h3 id="withdraw-modal-title">Withdraw application</h3>
        <button type="button" class="withdraw-modal__close" @click="emit('cancel')" aria-label="Close">✕</button>
      </header>

      <div class="withdraw-modal__body">
        <p v-if="requiresReason" class="withdraw-modal__notice">
          This application has been accepted. Please let the employer know why you're withdrawing.
        </p>
        <p v-else class="withdraw-modal__notice">
          Are you sure you want to withdraw this application?
        </p>

        <fieldset v-if="requiresReason" class="withdraw-modal__fieldset">
          <legend class="withdraw-modal__legend">Reason for withdrawal</legend>
          <label class="withdraw-modal__option">
            <input
              type="radio"
              name="withdrawal_reason"
              value="found_another_job"
              v-model="selectedReason"
            />
            <span>Found another job</span>
          </label>
          <label class="withdraw-modal__option">
            <input
              type="radio"
              name="withdrawal_reason"
              value="personal_reasons"
              v-model="selectedReason"
            />
            <span>Personal reasons</span>
          </label>
        </fieldset>
      </div>

      <footer class="withdraw-modal__footer">
        <button type="button" class="withdraw-modal__btn withdraw-modal__btn--cancel" @click="emit('cancel')">
          Cancel
        </button>
        <button
          type="button"
          class="withdraw-modal__btn withdraw-modal__btn--confirm"
          :disabled="requiresReason && !selectedReason"
          @click="handleConfirm"
        >
          Confirm withdrawal
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { WithdrawalReason } from '~/schemas/application';

const props = defineProps<{
  requiresReason: boolean;
}>();

const emit = defineEmits<{
  confirm: [reason?: WithdrawalReason];
  cancel: [];
}>();

const selectedReason = ref<WithdrawalReason | ''>('');

const handleConfirm = () => {
  if (props.requiresReason && !selectedReason.value) return;
  emit('confirm', selectedReason.value ? (selectedReason.value as WithdrawalReason) : undefined);
};
</script>

<style scoped>
.withdraw-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.withdraw-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.withdraw-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.withdraw-modal__header h3 {
  margin: 0;
  font-size: var(--text-lg);
}

.withdraw-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--text-base);
  line-height: 1;
  padding: var(--space-1);
}

.withdraw-modal__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.withdraw-modal__notice {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.withdraw-modal__fieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.withdraw-modal__legend {
  font-weight: 600;
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.withdraw-modal__option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
}

.withdraw-modal__option input[type="radio"] {
  accent-color: var(--color-primary-600);
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.withdraw-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.withdraw-modal__btn {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}

.withdraw-modal__btn--cancel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.withdraw-modal__btn--cancel:hover {
  background: var(--color-surface-raised);
}

.withdraw-modal__btn--confirm {
  background: var(--color-danger);
  border: 1px solid var(--color-danger);
  color: white;
}

.withdraw-modal__btn--confirm:hover:not(:disabled) {
  background: var(--color-danger-dark, #b91c1c);
  border-color: var(--color-danger-dark, #b91c1c);
}

.withdraw-modal__btn--confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
