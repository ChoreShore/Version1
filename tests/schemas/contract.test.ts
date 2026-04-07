import { describe, it, expect } from 'vitest';
import {
  ContractSchema,
  ContractStatusSchema,
  EscrowPaymentSchema,
  EscrowStatusSchema,
  TransactionSchema,
  TransactionTypeSchema,
  CreateContractSchema,
  validateCreateContract
} from '~/schemas/contract';

// ─── ContractStatusSchema ─────────────────────────────────────────────────────

describe('ContractStatusSchema', () => {
  it.each(['pending', 'active', 'completed', 'cancelled'])('accepts %s', (status) => {
    expect(ContractStatusSchema.safeParse(status).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(ContractStatusSchema.safeParse('paid').success).toBe(false);
  });
});

// ─── EscrowStatusSchema ───────────────────────────────────────────────────────

describe('EscrowStatusSchema', () => {
  it.each(['held', 'released', 'refunded'])('accepts %s', (status) => {
    expect(EscrowStatusSchema.safeParse(status).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(EscrowStatusSchema.safeParse('pending').success).toBe(false);
  });
});

// ─── TransactionTypeSchema ────────────────────────────────────────────────────

describe('TransactionTypeSchema', () => {
  it.each(['deposit', 'release', 'refund', 'fee'])('accepts %s', (type) => {
    expect(TransactionTypeSchema.safeParse(type).success).toBe(true);
  });

  it('rejects unknown type', () => {
    expect(TransactionTypeSchema.safeParse('payment').success).toBe(false);
  });
});

// ─── CreateContractSchema ─────────────────────────────────────────────────────

describe('CreateContractSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const valid = {
    application_id: validUuid,
    employer_id: validUuid,
    worker_id: validUuid,
    job_id: validUuid
  };

  it('accepts all valid UUIDs', () => {
    expect(CreateContractSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid application_id', () => {
    const result = CreateContractSchema.safeParse({ ...valid, application_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/invalid application id/i);
  });

  it('rejects missing employer_id', () => {
    const { employer_id, ...rest } = valid;
    expect(CreateContractSchema.safeParse(rest).success).toBe(false);
  });
});

// ─── validateCreateContract ───────────────────────────────────────────────────

describe('validateCreateContract', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const valid = {
    application_id: validUuid,
    employer_id: validUuid,
    worker_id: validUuid,
    job_id: validUuid
  };

  it('returns success for valid data', () => {
    const result = validateCreateContract(valid);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(valid);
  });

  it('returns errors for invalid data', () => {
    const result = validateCreateContract({ ...valid, job_id: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('job_id');
  });
});

// ─── EscrowPaymentSchema ──────────────────────────────────────────────────────

describe('EscrowPaymentSchema', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const valid = {
    id: validUuid,
    contract_id: validUuid,
    total_amount: 115,
    platform_fee: 15,
    worker_payout_amount: 100,
    status: 'held' as const,
    created_at: new Date().toISOString()
  };

  it('accepts a valid escrow payment', () => {
    expect(EscrowPaymentSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts null stripe_payment_intent_id', () => {
    expect(EscrowPaymentSchema.safeParse({ ...valid, stripe_payment_intent_id: null }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(EscrowPaymentSchema.safeParse({ ...valid, status: 'paid' }).success).toBe(false);
  });
});
