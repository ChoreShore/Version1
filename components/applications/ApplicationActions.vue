<template>
  <FormErrorBoundary
    form-name="application-actions"
    @form-error="handleFormError"
  >
    <div class="application-actions">
      <button
        type="button"
        class="application-actions__button application-actions__button--pending"
        :disabled="disabled || application?.status === 'pending'"
        @click="handleAction('pending')"
      >
        Move to pending
      </button>
      <button
        type="button"
        class="application-actions__button application-actions__button--success"
        :disabled="disabled || application?.status === 'accepted'"
        @click="handleAccept"
      >
        Accept
      </button>
      <button
        type="button"
        class="application-actions__button application-actions__button--danger"
        :disabled="disabled || application?.status === 'rejected'"
        @click="handleAction('rejected')"
      >
        Reject
      </button>
    </div>

    <PaymentModal
      v-if="showPaymentModal"
      :job-amount="application.job_budget_amount || 0"
      :platform-fee-percentage="platformFeePercentage"
      :application-id="application.id"
      @close="onModalClose"
      @success="onPaymentSuccess"
      @error="onPaymentError"
    />

  </FormErrorBoundary>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { ApplicationStatus, ApplicationWithDetails } from '~/schemas/application';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import PaymentModal from '~/components/payments/PaymentModal.vue';

const THIRTY_MINUTES = 30 * 60 * 1000;

const props = defineProps<{
  application: ApplicationWithDetails;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  action: [applicationId: string, status: ApplicationStatus];
}>();

const showPaymentModal = ref(false);
const paymentIntentId = ref<string | null>(null);

const platformFeePercentage = computed(() => 15);
const isFixedPriceJob = computed(() => props.application.job_budget_type === 'fixed');

const handleAction = (status: ApplicationStatus) => {
  if (!props.application?.id) return;
  emit('action', props.application.id, status);
};

const handleAccept = () => {
  if (!props.application?.id) return;

  if (!isFixedPriceJob.value) {
    handleAction('accepted');
    return;
  }

  showPaymentModal.value = true;
};

const onPaymentSuccess = (intentId: string) => {
  paymentIntentId.value = intentId;
};

const onPaymentError = () => {
  paymentIntentId.value = null;
};

const onModalClose = () => {
  showPaymentModal.value = false;
  if (!paymentIntentId.value) return;

  emit('action', props.application.id, 'accepted');
  paymentIntentId.value = null;
};

// Cleanup orphaned payment intents older than 30 minutes on mount
onMounted(() => {
  if (!props.application?.id) return;
  const key = `payment_intent_${props.application.id}`;
  const stored = localStorage.getItem(key);
  if (!stored) return;

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.timestamp && Date.now() - parsed.timestamp > THIRTY_MINUTES) {
      localStorage.removeItem(key);
    }
  } catch {
    // Invalid JSON — remove the stale entry
    localStorage.removeItem(key);
  }
});

// Error boundary handler
const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
  // You could also send this to your error monitoring service
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
