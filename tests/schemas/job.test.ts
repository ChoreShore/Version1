import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CreateJobSchema,
  UpdateJobSchema,
  BudgetTypeSchema,
  JobStatusSchema,
  validateCreateJob,
  validateUpdateJob
} from '~/schemas/job';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const futureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
};

const pastDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString();
};

const validJob = () => ({
  title: 'Plumber needed',
  description: 'We need a plumber to fix our pipes at home.',
  category_id: VALID_UUID,
  postcode: 'SW1A 1AA',
  budget_type: 'fixed' as const,
  budget_amount: 200,
  deadline: futureDate()
});

// ─── BudgetTypeSchema ─────────────────────────────────────────────────────────

describe('BudgetTypeSchema', () => {
  it('accepts "fixed"', () => {
    expect(BudgetTypeSchema.safeParse('fixed').success).toBe(true);
  });

  it('accepts "hourly"', () => {
    expect(BudgetTypeSchema.safeParse('hourly').success).toBe(true);
  });

  it('rejects an unknown type', () => {
    expect(BudgetTypeSchema.safeParse('daily').success).toBe(false);
  });
});

// ─── JobStatusSchema ──────────────────────────────────────────────────────────

describe('JobStatusSchema', () => {
  it.each(['draft', 'open', 'closed', 'completed'])('accepts "%s"', (status) => {
    expect(JobStatusSchema.safeParse(status).success).toBe(true);
  });

  it('rejects an unknown status', () => {
    expect(JobStatusSchema.safeParse('archived').success).toBe(false);
  });
});

// ─── CreateJobSchema ──────────────────────────────────────────────────────────

describe('CreateJobSchema', () => {
  it('accepts a fully valid job', () => {
    expect(CreateJobSchema.safeParse(validJob()).success).toBe(true);
  });

  describe('title', () => {
    it('rejects an empty title', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), title: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });

    it('rejects a title over 100 characters', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), title: 'A'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 100 characters/i);
    });

    it('accepts exactly 100 characters', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), title: 'A'.repeat(100) }).success).toBe(true);
    });

    it('trims whitespace from title', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), title: '  Plumber needed  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.title).toBe('Plumber needed');
    });
  });

  describe('description', () => {
    it('rejects a description under 10 characters', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), description: 'Too short' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least 10 characters/i);
    });

    it('rejects a description over 2000 characters', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), description: 'a'.repeat(2001) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 2000 characters/i);
    });

    it('accepts exactly 10 characters', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), description: 'a'.repeat(10) }).success).toBe(true);
    });

    it('accepts exactly 2000 characters', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), description: 'a'.repeat(2000) }).success).toBe(true);
    });
  });

  describe('category_id', () => {
    it('rejects a non-UUID category_id', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), category_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid category ID format/i);
    });

    it('accepts a valid UUID', () => {
      expect(CreateJobSchema.safeParse(validJob()).success).toBe(true);
    });
  });

  describe('postcode', () => {
    it('rejects a postcode under 4 characters', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), postcode: 'SW1' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least 4 characters/i);
    });

    it('rejects a postcode over 10 characters', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), postcode: 'A'.repeat(11) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 10 characters/i);
    });

    it('accepts a valid postcode', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), postcode: 'SW1A 1AA' }).success).toBe(true);
    });
  });

  describe('budget_type', () => {
    it('accepts "fixed"', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), budget_type: 'fixed' }).success).toBe(true);
    });

    it('accepts "hourly"', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), budget_type: 'hourly' }).success).toBe(true);
    });

    it('rejects an unknown budget type', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), budget_type: 'daily' }).success).toBe(false);
    });
  });

  describe('budget_amount', () => {
    it('rejects zero', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), budget_amount: 0 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/positive/i);
    });

    it('rejects a negative amount', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), budget_amount: -100 }).success).toBe(false);
    });

    it('rejects an amount over 1,000,000', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), budget_amount: 1_000_001 });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/too large/i);
    });

    it('accepts exactly 1,000,000', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), budget_amount: 1_000_000 }).success).toBe(true);
    });
  });

  describe('deadline — future-date refinement', () => {
    it('accepts a date in the future', () => {
      expect(CreateJobSchema.safeParse({ ...validJob(), deadline: futureDate() }).success).toBe(true);
    });

    it('rejects a date in the past', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), deadline: pastDate() });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/must be in the future/i);
    });

    it('rejects an empty deadline', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), deadline: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });

    it('rejects a non-date string', () => {
      const result = CreateJobSchema.safeParse({ ...validJob(), deadline: 'not-a-date' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid deadline format/i);
    });
  });
});

// ─── UpdateJobSchema ──────────────────────────────────────────────────────────

describe('UpdateJobSchema', () => {
  it('accepts an empty object (all fields optional)', () => {
    expect(UpdateJobSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a partial update with only title', () => {
    expect(UpdateJobSchema.safeParse({ title: 'New title' }).success).toBe(true);
  });

  it('still rejects an invalid deadline if provided', () => {
    const result = UpdateJobSchema.safeParse({ deadline: pastDate() });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/must be in the future/i);
  });

  it('still rejects a non-UUID category_id if provided', () => {
    const result = UpdateJobSchema.safeParse({ category_id: 'bad-id' });
    expect(result.success).toBe(false);
  });
});

// ─── validateCreateJob helper ─────────────────────────────────────────────────

describe('validateCreateJob', () => {
  it('returns success:true with parsed data for a valid job', () => {
    const result = validateCreateJob(validJob());
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.errors).toBeNull();
  });

  it('returns success:false with field errors for a past deadline', () => {
    const result = validateCreateJob({ ...validJob(), deadline: pastDate() });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('deadline');
  });

  it('returns success:false with field errors for an invalid category_id', () => {
    const result = validateCreateJob({ ...validJob(), category_id: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('category_id');
  });

  it('returns success:false with field errors for a short description', () => {
    const result = validateCreateJob({ ...validJob(), description: 'Short' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('description');
  });

  it('returns success:false with field errors for zero budget', () => {
    const result = validateCreateJob({ ...validJob(), budget_amount: 0 });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('budget_amount');
  });
});

// ─── validateUpdateJob helper ─────────────────────────────────────────────────

describe('validateUpdateJob', () => {
  it('returns success:true for an empty payload', () => {
    const result = validateUpdateJob({});
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
  });

  it('returns success:true for a valid partial update', () => {
    const result = validateUpdateJob({ title: 'Updated title', budget_amount: 500 });
    expect(result.success).toBe(true);
  });

  it('returns success:false with field errors for a past deadline', () => {
    const result = validateUpdateJob({ deadline: pastDate() });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('deadline');
  });
});
