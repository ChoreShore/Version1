import { describe, it, expect } from 'vitest';
import { calculateEscrowFees, PLATFORM_FEE_RATE } from '~/server/utils/fees';

describe('calculateEscrowFees', () => {
  it('calculates correct platform fee and total for £100 job', () => {
    const result = calculateEscrowFees(100);
    expect(result.platform_fee_amount).toBe(15);
    expect(result.total_amount).toBe(115);
    expect(result.worker_payout_amount).toBe(100);
    expect(result.platform_fee_rate).toBe(PLATFORM_FEE_RATE);
  });

  it('calculates correct values for £50 job', () => {
    const result = calculateEscrowFees(50);
    expect(result.platform_fee_amount).toBe(7.5);
    expect(result.total_amount).toBe(57.5);
    expect(result.worker_payout_amount).toBe(50);
  });

  it('handles zero amount without throwing', () => {
    const result = calculateEscrowFees(0);
    expect(result.total_amount).toBe(0);
    expect(result.platform_fee_amount).toBe(0);
  });

  it('rounds to 2 decimal places', () => {
    const result = calculateEscrowFees(33.33);
    expect(result.platform_fee_amount).toBe(5);
    expect(result.total_amount).toBe(38.33);
  });

  it('worker_payout_amount always equals job_amount', () => {
    const amount = 250;
    const result = calculateEscrowFees(amount);
    expect(result.worker_payout_amount).toBe(amount);
    expect(result.job_amount).toBe(amount);
  });
});
