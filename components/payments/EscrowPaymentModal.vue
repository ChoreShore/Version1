<template>
  <Modal
    :model-value="true"
    title="Pay to Activate Contract"
    eyebrow="Escrow Payment"
    description="Funds are held securely until the job is complete."
    size="sm"
    @update:model-value="$emit('cancel')"
    @close="$emit('cancel')"
  >
    <div class="escrow-modal">
      <div v-if="error" class="escrow-modal__error">{{ error }}</div>

      <dl class="escrow-modal__breakdown">
        <div class="escrow-modal__row">
          <dt>Job amount</dt>
          <dd>£{{ fees.worker_payout_amount.toFixed(2) }}</dd>
        </div>
        <div class="escrow-modal__row">
          <dt>Platform fee ({{ (fees.platform_fee_rate * 100).toFixed(0) }}%)</dt>
          <dd>£{{ fees.platform_fee_amount.toFixed(2) }}</dd>
        </div>
        <div class="escrow-modal__row escrow-modal__row--total">
          <dt>Total charged to you</dt>
          <dd>£{{ fees.total_amount.toFixed(2) }}</dd>
        </div>
      </dl>

      <p class="escrow-modal__notice">
        Worker receives: <strong>£{{ fees.worker_payout_amount.toFixed(2) }}</strong> upon completion.
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        class="escrow-modal__cancel"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        class="escrow-modal__confirm"
        :disabled="loading"
        @click="handleConfirm"
      >
        {{ loading ? 'Processing...' : `Pay £${fees.total_amount.toFixed(2)}` }}
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from '~/components/primitives/Modal.vue';
import { usePayments } from '~/composables/usePayments';
import type { FeeCalculation } from '~/schemas/payment';

const props = defineProps<{
  contractId: string;
  fees: FeeCalculation;
}>();

const emit = defineEmits<{
  confirmed: [];
  cancel: [];
}>();

const paymentsApi = usePayments();
const loading = ref(false);
const error = ref<string | null>(null);

const handleConfirm = async () => {
  loading.value = true;
  error.value = null;
  try {
    const { payment_intent } = await paymentsApi.createEscrow(props.contractId);
    await paymentsApi.confirmEscrow(props.contractId, payment_intent.id);
    emit('confirmed');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Payment failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.escrow-modal__error {
  background: rgba(217, 48, 37, 0.1);
  color: var(--color-danger);
  border: 1px solid rgba(217, 48, 37, 0.25);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.escrow-modal__breakdown {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  background: var(--color-surface-muted);
}

.escrow-modal__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.escrow-modal__row dt {
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.escrow-modal__row dd {
  margin: 0;
  font-weight: 600;
}

.escrow-modal__row--total {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-2);
  margin-top: var(--space-2);
}

.escrow-modal__row--total dt,
.escrow-modal__row--total dd {
  color: var(--color-text);
  font-size: var(--text-base);
  font-weight: 700;
}

.escrow-modal__notice {
  margin: var(--space-4) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

.escrow-modal__cancel {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 10px 20px;
  cursor: pointer;
}

.escrow-modal__cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.escrow-modal__confirm {
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
}

.escrow-modal__confirm:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.escrow-modal__confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
