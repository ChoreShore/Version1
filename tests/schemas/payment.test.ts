import { describe, it, expect } from 'vitest';
import {
  CreateEscrowSchema,
  ConfirmEscrowSchema,
  ReleaseFundsSchema,
  RefundEscrowSchema,
  FeeCalculationSchema,
  validateCreateEscrow,
  validateConfirmEscrow,
  validateReleaseFunds,
  validateRefundEscrow
} from '~/schemas/payment';

const validUuid = '123e4567-e89b-12d3-a456-426614174000';

// ─── CreateEscrowSchema ───────────────────────────────────────────────────────

describe('CreateEscrowSchema', () => {
  it('accepts a valid contract_id', () => {
    expect(CreateEscrowSchema.safeParse({ contract_id: validUuid }).success).toBe(true);
  });

  it('rejects an invalid contract_id', () => {
    const result = CreateEscrowSchema.safeParse({ contract_id: 'bad-id' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/invalid contract id/i);
  });

  it('rejects missing contract_id', () => {
    expect(CreateEscrowSchema.safeParse({}).success).toBe(false);
  });
});

// ─── ConfirmEscrowSchema ──────────────────────────────────────────────────────

describe('ConfirmEscrowSchema', () => {
  const valid = { contract_id: validUuid, payment_intent_id: 'pi_mock_abc123' };

  it('accepts valid data', () => {
    expect(ConfirmEscrowSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty payment_intent_id', () => {
    const result = ConfirmEscrowSchema.safeParse({ ...valid, payment_intent_id: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
  });

  it('rejects missing contract_id', () => {
    expect(ConfirmEscrowSchema.safeParse({ payment_intent_id: 'pi_x' }).success).toBe(false);
  });
});

// ─── ReleaseFundsSchema ───────────────────────────────────────────────────────

describe('ReleaseFundsSchema', () => {
  it('accepts a valid contract_id', () => {
    expect(ReleaseFundsSchema.safeParse({ contract_id: validUuid }).success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(ReleaseFundsSchema.safeParse({ contract_id: 'invalid' }).success).toBe(false);
  });
});

// ─── RefundEscrowSchema ───────────────────────────────────────────────────────

describe('RefundEscrowSchema', () => {
  it('accepts a valid contract_id', () => {
    expect(RefundEscrowSchema.safeParse({ contract_id: validUuid }).success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(RefundEscrowSchema.safeParse({ contract_id: 123 }).success).toBe(false);
  });
});

// ─── FeeCalculationSchema ─────────────────────────────────────────────────────

describe('FeeCalculationSchema', () => {
  const valid = {
    job_amount: 100,
    platform_fee_rate: 0.15,
    platform_fee_amount: 15,
    total_amount: 115,
    worker_payout_amount: 100
  };

  it('accepts valid fee breakdown', () => {
    expect(FeeCalculationSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects negative job_amount', () => {
    expect(FeeCalculationSchema.safeParse({ ...valid, job_amount: -5 }).success).toBe(false);
  });
});

// ─── validateCreateEscrow ─────────────────────────────────────────────────────

describe('validateCreateEscrow', () => {
  it('returns success for valid data', () => {
    const result = validateCreateEscrow({ contract_id: validUuid });
    expect(result.success).toBe(true);
    expect(result.data?.contract_id).toBe(validUuid);
  });

  it('returns errors for invalid data', () => {
    const result = validateCreateEscrow({ contract_id: 'not-uuid' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('contract_id');
  });
});

// ─── validateConfirmEscrow ────────────────────────────────────────────────────

describe('validateConfirmEscrow', () => {
  it('returns success for valid data', () => {
    const result = validateConfirmEscrow({ contract_id: validUuid, payment_intent_id: 'pi_mock_x' });
    expect(result.success).toBe(true);
  });

  it('returns errors when payment_intent_id is missing', () => {
    const result = validateConfirmEscrow({ contract_id: validUuid });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('payment_intent_id');
  });
});
