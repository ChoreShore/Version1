import type { MockPaymentIntent } from '~/schemas/payment';

export const mockStripe = {
  createPaymentIntent(totalAmount: number, platformFee: number, workerPayout: number): MockPaymentIntent {
    return {
      id: `pi_mock_${crypto.randomUUID().replace(/-/g, '')}`,
      amount: totalAmount,
      currency: 'gbp',
      status: 'requires_confirmation',
      platform_fee: platformFee,
      worker_payout: workerPayout
    };
  },

  confirmPaymentIntent(id: string): MockPaymentIntent & { status: 'succeeded' } {
    return {
      id,
      amount: 0,
      currency: 'gbp',
      status: 'succeeded',
      platform_fee: 0,
      worker_payout: 0
    };
  },

  refundPaymentIntent(id: string): MockPaymentIntent & { status: 'refunded' } {
    return {
      id,
      amount: 0,
      currency: 'gbp',
      status: 'refunded',
      platform_fee: 0,
      worker_payout: 0
    };
  },

  generateTransactionId(): string {
    return `txn_mock_${crypto.randomUUID().replace(/-/g, '')}`;
  }
};
