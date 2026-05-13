<template>
  <div class="payment-modal-overlay" @click.self="emit('close')">
    <div class="payment-modal">
      <header class="payment-modal__header">
        <h2>Complete Payment Before Accepting</h2>
        <button class="payment-modal__close" @click="emit('close')">×</button>
      </header>

      <div class="payment-modal__content">
        <div class="payment-modal__summary">
          <h3>Payment Summary</h3>
          <div class="payment-summary__row">
            <span>Job Amount</span>
            <strong>${{ jobAmount.toFixed(2) }}</strong>
          </div>
          <div class="payment-summary__row">
            <span>Platform Fee ({{ platformFeePercentage }}%)</span>
            <strong>${{ platformFee.toFixed(2) }}</strong>
          </div>
          <div class="payment-summary__row payment-summary__row--total">
            <span>Total Escrow</span>
            <strong>${{ totalAmount.toFixed(2) }}</strong>
          </div>
        </div>

        <div class="payment-modal__form">
          <div v-if="!processing && !success" class="payment-form">
            <label for="card-element">Mock Card Details</label>
            <div id="card-element" class="card-element">
              <input
                type="text"
                placeholder="Card number (mock)"
                class="card-input"
                v-model="cardNumber"
                maxlength="16"
              />
              <div class="card-inputs-row">
                <input
                  type="text"
                  placeholder="MM/YY"
                  class="card-input card-input--small"
                  v-model="expiry"
                  maxlength="5"
                />
                <input
                  type="text"
                  placeholder="CVC"
                  class="card-input card-input--small"
                  v-model="cvc"
                  maxlength="3"
                />
              </div>
            </div>
          </div>

          <div v-if="processing" class="payment-modal__processing">
            <div class="spinner"></div>
            <p>Processing mock payment...</p>
          </div>

          <div v-if="success" class="payment-modal__success">
            <div class="success-icon">✓</div>
            <p>Payment processed. You can now accept this application.</p>
          </div>

          <div v-if="error" class="payment-modal__error">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>

      <footer class="payment-modal__footer">
        <button
          v-if="!processing && !success"
          class="payment-modal__button payment-modal__button--cancel"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          v-if="!processing && !success"
          class="payment-modal__button payment-modal__button--confirm"
          @click="processPayment"
          :disabled="!isFormValid"
        >
          Pay & Continue
        </button>
        <button
          v-if="success"
          class="payment-modal__button payment-modal__button--confirm"
          @click="onComplete"
        >
          Continue to Accept
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PaymentIntentResponseInput } from '~/schemas/payment';

const props = defineProps<{
  jobAmount: number;
  platformFeePercentage: number;
  applicationId: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [paymentIntentId: string];
  error: [message: string];
}>();

const platformFee = computed(() => props.jobAmount * (props.platformFeePercentage / 100));
const totalAmount = computed(() => props.jobAmount + platformFee.value);

const cardNumber = ref('');
const expiry = ref('');
const cvc = ref('');
const processing = ref(false);
const success = ref(false);
const error = ref<string | null>(null);

const isFormValid = computed(() =>
  cardNumber.value.length === 16 &&
  expiry.value.length === 5 &&
  cvc.value.length === 3
);

const processPayment = async () => {
  if (!isFormValid.value) return;

  processing.value = true;
  error.value = null;

  try {
    const idempotencyKey = `payment_${props.applicationId}`;
    const intent = await $fetch<PaymentIntentResponseInput>('/api/payments/create-intent', {
      method: 'POST',
      body: {
        application_id: props.applicationId,
        idempotency_key: idempotencyKey
      }
    });

    await $fetch('/api/payments/confirm', {
      method: 'POST',
      body: {
        application_id: props.applicationId,
        payment_intent_id: intent.payment_intent_id
      }
    });

    success.value = true;
    emit('success', intent.payment_intent_id);
  } catch (err: any) {
    const errorMessage = err?.data?.statusMessage || err?.message || 'Payment failed. Please try again.';
    error.value = errorMessage;
    emit('error', errorMessage);
  } finally {
    processing.value = false;
  }
};

const onComplete = () => {
  if (success.value) {
    emit('close');
  }
};
</script>

<style scoped>
.payment-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.payment-modal {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  max-width: 520px;
  width: 92%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.payment-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.payment-modal__header h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.payment-modal__close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--color-text-muted);
  line-height: 1;
}

.payment-modal__content {
  padding: var(--space-5);
}

.payment-modal__summary {
  margin-bottom: var(--space-5);
}

.payment-modal__summary h3 {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
}

.payment-summary__row {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.payment-summary__row--total {
  border-bottom: none;
  border-top: 2px solid var(--color-border);
  font-weight: 700;
  font-size: var(--text-lg);
  padding-top: var(--space-3);
  margin-top: var(--space-2);
}

.payment-form label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 600;
  font-size: var(--text-sm);
}

.card-element {
  padding: var(--space-3);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.card-input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  margin-bottom: var(--space-2);
}

.card-input--small {
  width: calc(50% - var(--space-1));
  margin-bottom: 0;
}

.card-inputs-row {
  display: flex;
  gap: var(--space-2);
}

.payment-modal__processing,
.payment-modal__success {
  text-align: center;
  padding: var(--space-8) 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  margin: 0 auto var(--space-3);
}

.payment-modal__success {
  color: var(--color-success-600);
}

.success-icon {
  font-size: 3rem;
  margin-bottom: var(--space-3);
}

.payment-modal__error {
  padding: var(--space-3);
  background: var(--color-error-100);
  border: 1px solid var(--color-error-300);
  border-radius: var(--radius-md);
  color: var(--color-error-700);
  margin-bottom: var(--space-3);
}

.payment-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.payment-modal__button {
  padding: var(--space-3) var(--space-5);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-sm);
}

.payment-modal__button--cancel {
  background: var(--color-background);
  color: var(--color-text);
}

.payment-modal__button--confirm {
  background: var(--color-primary-600);
  color: white;
}

.payment-modal__button--confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
