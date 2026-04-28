import type {
  CreatePaymentIntentInput,
  ConfirmPaymentInput,
  PayoutInput,
  PaymentIntentResponseInput,
  PaymentConfirmationResponseInput,
  PayoutResponseInput,
  PaymentsListResponseInput
} from '~/schemas/payment';
import type { Role } from '~/schemas/role';

export const usePayments = () => {
  const listEvents = async (role?: Role) => {
    return await $fetch<PaymentsListResponseInput>('/api/payments', {
      params: role ? { role } : undefined
    });
  };

  const createIntent = async (payload: CreatePaymentIntentInput) => {
    return await $fetch<PaymentIntentResponseInput>('/api/payments/create-intent', {
      method: 'POST',
      body: payload
    });
  };

  const confirmPayment = async (payload: ConfirmPaymentInput) => {
    return await $fetch<PaymentConfirmationResponseInput>('/api/payments/confirm', {
      method: 'POST',
      body: payload
    });
  };

  const processPayout = async (payload: PayoutInput) => {
    return await $fetch<PayoutResponseInput>('/api/payments/payout', {
      method: 'POST',
      body: payload
    });
  };

  return {
    listEvents,
    createIntent,
    confirmPayment,
    processPayout
  };
};
