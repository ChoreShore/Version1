import type {
  PaymentMethodConnectInput,
  PaymentMethodDisconnectInput,
  PaymentMethodMutationResponseInput,
  PaymentMethodsResponseInput,
  PaymentMethodVerifyInput
} from '~/schemas/payment';

export const usePaymentMethods = () => {
  const listMethods = async () => {
    return await $fetch<PaymentMethodsResponseInput>('/api/payments/methods');
  };

  const connectMethod = async (payload: PaymentMethodConnectInput) => {
    return await $fetch<PaymentMethodMutationResponseInput>('/api/payments/methods/connect', {
      method: 'POST',
      body: payload
    });
  };

  const verifyMethod = async (payload: PaymentMethodVerifyInput) => {
    return await $fetch<PaymentMethodMutationResponseInput>('/api/payments/methods/verify', {
      method: 'POST',
      body: payload
    });
  };

  const disconnectMethod = async (payload: PaymentMethodDisconnectInput) => {
    return await $fetch<PaymentMethodMutationResponseInput>('/api/payments/methods/disconnect', {
      method: 'POST',
      body: payload
    });
  };

  return {
    listMethods,
    connectMethod,
    verifyMethod,
    disconnectMethod
  };
};
