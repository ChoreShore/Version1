import type {
  EscrowPaymentResponse,
  ConfirmEscrowResponse,
  ReleaseFundsResponse,
  RefundEscrowResponse
} from '~/schemas/payment';

export const usePayments = () => {
  const createEscrow = async (contractId: string) => {
    return await $fetch<EscrowPaymentResponse & { fee_breakdown: any }>('/api/payments/create-escrow', {
      method: 'POST',
      body: { contract_id: contractId }
    });
  };

  const confirmEscrow = async (contractId: string, paymentIntentId: string) => {
    return await $fetch<ConfirmEscrowResponse>('/api/payments/confirm-escrow', {
      method: 'POST',
      body: { contract_id: contractId, payment_intent_id: paymentIntentId }
    });
  };

  const releaseFunds = async (contractId: string) => {
    return await $fetch<ReleaseFundsResponse>('/api/payments/release-funds', {
      method: 'POST',
      body: { contract_id: contractId }
    });
  };

  const refundEscrow = async (contractId: string) => {
    return await $fetch<RefundEscrowResponse>('/api/payments/refund-escrow', {
      method: 'POST',
      body: { contract_id: contractId }
    });
  };

  const getTransactionHistory = async () => {
    return await $fetch<{ transactions: any[] }>('/api/transactions/history');
  };

  return {
    createEscrow,
    confirmEscrow,
    releaseFunds,
    refundEscrow,
    getTransactionHistory
  };
};
