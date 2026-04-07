import type { FeeCalculation } from '~/schemas/payment';

export const PLATFORM_FEE_RATE = 0.15;

export function calculateEscrowFees(jobAmount: number): FeeCalculation {
  const platform_fee_amount = Math.round(jobAmount * PLATFORM_FEE_RATE * 100) / 100;
  const total_amount = Math.round((jobAmount + platform_fee_amount) * 100) / 100;

  return {
    job_amount: jobAmount,
    platform_fee_rate: PLATFORM_FEE_RATE,
    platform_fee_amount,
    total_amount,
    worker_payout_amount: jobAmount
  };
}
