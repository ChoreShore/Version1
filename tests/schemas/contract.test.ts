import { describe, it, expect } from 'vitest';
import {
  ContractSchema,
  ContractStatusSchema,
  CreateContractSchema,
  validateCreateContract
} from '~/schemas/contract';

// ─── ContractStatusSchema ─────────────────────────────────────────────────────

describe('ContractStatusSchema', () => {
  it.each(['pending', 'active', 'pending_review', 'completed', 'cancelled'])('accepts %s', (status) => {
    expect(ContractStatusSchema.safeParse(status).success).toBe(true);
  });

  it('rejects unknown status', () => {
    expect(ContractStatusSchema.safeParse('paid').success).toBe(false);
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

