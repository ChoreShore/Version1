import { describe, it, expect } from 'vitest';
import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
  WithdrawalReasonSchema,
  ApplicationStatusSchema,
  validateCreateApplication,
  validateUpdateApplication
} from '~/schemas/application';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

// ─── WithdrawalReasonSchema ───────────────────────────────────────────────────

describe('WithdrawalReasonSchema', () => {
  it('accepts "found_another_job"', () => {
    expect(WithdrawalReasonSchema.safeParse('found_another_job').success).toBe(true);
  });

  it('accepts "personal_reasons"', () => {
    expect(WithdrawalReasonSchema.safeParse('personal_reasons').success).toBe(true);
  });

  it('rejects an unknown reason', () => {
    expect(WithdrawalReasonSchema.safeParse('changed_mind').success).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(WithdrawalReasonSchema.safeParse('').success).toBe(false);
  });
});

// ─── ApplicationStatusSchema ──────────────────────────────────────────────────

describe('ApplicationStatusSchema', () => {
  it.each(['pending', 'accepted', 'rejected', 'withdrawn'])('accepts "%s"', (status) => {
    expect(ApplicationStatusSchema.safeParse(status).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(ApplicationStatusSchema.safeParse('archived').success).toBe(false);
  });
});

// ─── CreateApplicationSchema ──────────────────────────────────────────────────

describe('CreateApplicationSchema', () => {
  const valid = { job_id: VALID_UUID };

  describe('job_id', () => {
    it('accepts a valid UUID', () => {
      expect(CreateApplicationSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects a non-UUID string', () => {
      const result = CreateApplicationSchema.safeParse({ job_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid job ID format/);
    });

    it('rejects a missing job_id', () => {
      expect(CreateApplicationSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('cover_letter (optional)', () => {
    it('accepts a valid cover letter', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, cover_letter: 'This is a valid cover letter text.' });
      expect(result.success).toBe(true);
    });

    it('is valid when omitted', () => {
      expect(CreateApplicationSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects a cover letter under 10 characters', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, cover_letter: 'Short' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least 10 characters/);
    });

    it('rejects a cover letter over 1000 characters', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, cover_letter: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 1000 characters/);
    });

    it('trims whitespace from cover letter', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, cover_letter: '   Valid cover letter   ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.cover_letter).toBe('Valid cover letter');
    });

    it('accepts exactly 10 characters', () => {
      expect(CreateApplicationSchema.safeParse({ ...valid, cover_letter: 'a'.repeat(10) }).success).toBe(true);
    });

    it('accepts exactly 1000 characters', () => {
      expect(CreateApplicationSchema.safeParse({ ...valid, cover_letter: 'a'.repeat(1000) }).success).toBe(true);
    });
  });

  describe('proposed_rate (optional, £20–£30)', () => {
    it('is valid when omitted', () => {
      expect(CreateApplicationSchema.safeParse(valid).success).toBe(true);
    });

    it('accepts the minimum rate of 20', () => {
      expect(CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 20 }).success).toBe(true);
    });

    it('accepts the maximum rate of 30', () => {
      expect(CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 30 }).success).toBe(true);
    });

    it('accepts a mid-range rate of 25', () => {
      expect(CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 25 }).success).toBe(true);
    });

    it('rejects a rate below 20', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 19 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least £20/);
    });

    it('rejects a rate of 0', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects a negative rate', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, proposed_rate: -5 });
      expect(result.success).toBe(false);
    });

    it('rejects a rate above 30', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, proposed_rate: 31 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/no more than £30/);
    });

    it('rejects a string rate', () => {
      const result = CreateApplicationSchema.safeParse({ ...valid, proposed_rate: '25' });
      expect(result.success).toBe(false);
    });
  });
});

// ─── UpdateApplicationSchema ──────────────────────────────────────────────────

describe('UpdateApplicationSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateApplicationSchema.safeParse({}).success).toBe(true);
  });

  describe('status', () => {
    it.each(['pending', 'accepted', 'rejected', 'withdrawn'])('accepts status "%s"', (status) => {
      expect(UpdateApplicationSchema.safeParse({ status }).success).toBe(true);
    });

    it('rejects an invalid status', () => {
      expect(UpdateApplicationSchema.safeParse({ status: 'deleted' }).success).toBe(false);
    });
  });

  describe('cover_letter', () => {
    it('accepts a valid cover letter', () => {
      const result = UpdateApplicationSchema.safeParse({ cover_letter: 'Updated cover letter text.' });
      expect(result.success).toBe(true);
    });

    it('rejects a cover letter under 10 characters', () => {
      const result = UpdateApplicationSchema.safeParse({ cover_letter: 'Short' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least 10 characters/);
    });

    it('rejects a cover letter over 1000 characters', () => {
      const result = UpdateApplicationSchema.safeParse({ cover_letter: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
    });
  });

  describe('proposed_rate (£20–£30)', () => {
    it('accepts 20', () => {
      expect(UpdateApplicationSchema.safeParse({ proposed_rate: 20 }).success).toBe(true);
    });

    it('accepts 30', () => {
      expect(UpdateApplicationSchema.safeParse({ proposed_rate: 30 }).success).toBe(true);
    });

    it('rejects 19', () => {
      const result = UpdateApplicationSchema.safeParse({ proposed_rate: 19 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least £20/);
    });

    it('rejects 31', () => {
      const result = UpdateApplicationSchema.safeParse({ proposed_rate: 31 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/no more than £30/);
    });
  });

  describe('withdrawal_reason', () => {
    it('accepts "found_another_job"', () => {
      const result = UpdateApplicationSchema.safeParse({
        status: 'withdrawn',
        withdrawal_reason: 'found_another_job'
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.withdrawal_reason).toBe('found_another_job');
    });

    it('accepts "personal_reasons"', () => {
      const result = UpdateApplicationSchema.safeParse({
        status: 'withdrawn',
        withdrawal_reason: 'personal_reasons'
      });
      expect(result.success).toBe(true);
    });

    it('is valid when omitted', () => {
      expect(UpdateApplicationSchema.safeParse({ status: 'withdrawn' }).success).toBe(true);
    });

    it('rejects an unknown withdrawal reason', () => {
      const result = UpdateApplicationSchema.safeParse({
        status: 'withdrawn',
        withdrawal_reason: 'too_far_away'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('combined valid payloads', () => {
    it('accepts a full withdrawal payload', () => {
      const result = UpdateApplicationSchema.safeParse({
        status: 'withdrawn',
        withdrawal_reason: 'found_another_job'
      });
      expect(result.success).toBe(true);
    });

    it('accepts a status-only accept payload', () => {
      const result = UpdateApplicationSchema.safeParse({ status: 'accepted' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.withdrawal_reason).toBeUndefined();
    });
  });
});

// ─── validateCreateApplication helper ────────────────────────────────────────

describe('validateCreateApplication', () => {
  it('returns success:true with parsed data for a minimal valid payload', () => {
    const result = validateCreateApplication({ job_id: VALID_UUID });
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.errors).toBeNull();
  });

  it('returns success:true with all optional fields supplied', () => {
    const result = validateCreateApplication({
      job_id: VALID_UUID,
      cover_letter: 'I am a great fit for this role.',
      proposed_rate: 25
    });
    expect(result.success).toBe(true);
    expect(result.data?.proposed_rate).toBe(25);
  });

  it('returns success:false with field errors for invalid job_id', () => {
    const result = validateCreateApplication({ job_id: 'bad-id' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('job_id');
  });

  it('returns success:false with field errors for out-of-range rate', () => {
    const result = validateCreateApplication({ job_id: VALID_UUID, proposed_rate: 50 });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('proposed_rate');
  });

  it('returns success:false with field errors for short cover letter', () => {
    const result = validateCreateApplication({ job_id: VALID_UUID, cover_letter: 'Hi' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('cover_letter');
  });
});

// ─── validateUpdateApplication helper ────────────────────────────────────────

describe('validateUpdateApplication', () => {
  it('returns success:true for an empty payload', () => {
    const result = validateUpdateApplication({});
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
  });

  it('returns success:true for a valid withdrawal with reason', () => {
    const result = validateUpdateApplication({
      status: 'withdrawn',
      withdrawal_reason: 'personal_reasons'
    });
    expect(result.success).toBe(true);
    expect(result.data?.withdrawal_reason).toBe('personal_reasons');
  });

  it('returns success:false with field errors for an invalid status', () => {
    const result = validateUpdateApplication({ status: 'cancelled' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('status');
  });

  it('returns success:false with field errors for an invalid withdrawal reason', () => {
    const result = validateUpdateApplication({
      status: 'withdrawn',
      withdrawal_reason: 'bad_reason'
    });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('withdrawal_reason');
  });

  it('returns success:false with field errors for a rate below £20', () => {
    const result = validateUpdateApplication({ proposed_rate: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('proposed_rate');
  });
});
