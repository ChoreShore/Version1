import { describe, it, expect } from 'vitest';
import {
  RtwVerifySchema,
  RtwApiResponseSchema,
  validateRtwVerify
} from '~/schemas/rtw';

describe('RtwVerifySchema', () => {
  const validPayload = {
    code: 'W1234567',
    dob: '07-09-1999',
    forename: 'John',
    surname: 'Doe'
  };

  describe('code field', () => {
    it('accepts a valid W-prefixed share code', () => {
      const result = RtwVerifySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('uppercases the code before validation', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, code: 'w1234567' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.code).toBe('W1234567');
    });

    it('rejects a code not starting with W', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, code: 'R1234567' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/start with 'W'/i);
      }
    });

    it('rejects an empty code', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, code: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('dob field', () => {
    it('accepts a valid dd-mm-yyyy date', () => {
      const result = RtwVerifySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects yyyy-mm-dd format', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, dob: '1999-09-07' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/dd-mm-yyyy/i);
      }
    });

    it('rejects dd/mm/yyyy format', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, dob: '07/09/1999' });
      expect(result.success).toBe(false);
    });

    it('rejects a plaintext date', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, dob: 'not-a-date' });
      expect(result.success).toBe(false);
    });

    it('rejects an empty dob', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, dob: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('forename field', () => {
    it('accepts a valid first name', () => {
      const result = RtwVerifySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects an empty forename', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, forename: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a forename over 100 characters', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, forename: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from forename', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, forename: '  John  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.forename).toBe('John');
    });
  });

  describe('surname field', () => {
    it('accepts a valid surname', () => {
      const result = RtwVerifySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects an empty surname', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, surname: '' });
      expect(result.success).toBe(false);
    });

    it('rejects a surname over 100 characters', () => {
      const result = RtwVerifySchema.safeParse({ ...validPayload, surname: 'Z'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('missing fields', () => {
    it('rejects payload with no code', () => {
      const { code: _c, ...rest } = validPayload;
      const result = RtwVerifySchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('rejects completely empty object', () => {
      const result = RtwVerifySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe('RtwApiResponseSchema', () => {
  const acceptedResponse = {
    code: 200,
    status: {
      outcome: 'ACCEPTED',
      name: 'JOHN DOE',
      expiry_date: '30/03/2028',
      start_date: '08/02/2025',
      details: 'They have permission to work in the UK until 30 March 2028',
      conditions: 'N/A',
      rejected_reason: null
    }
  };

  it('parses a valid ACCEPTED response', () => {
    const result = RtwApiResponseSchema.safeParse(acceptedResponse);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status.outcome).toBe('ACCEPTED');
  });

  it('parses a NOT_FOUND response', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'NOT_FOUND' }
    });
    expect(result.success).toBe(true);
  });

  it('parses a SHARE_CODE_LOCKED response', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'SHARE_CODE_LOCKED' }
    });
    expect(result.success).toBe(true);
  });

  it('parses a SHARE_CODE_EXPIRED response', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'SHARE_CODE_EXPIRED' }
    });
    expect(result.success).toBe(true);
  });

  it('parses a REJECTED response with rejected_reason', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'REJECTED', rejected_reason: 'STUDENT' }
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status.rejected_reason).toBe('STUDENT');
  });

  it('rejects an unknown outcome', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'UNKNOWN_OUTCOME' }
    });
    expect(result.success).toBe(false);
  });

  it('rejects a response with missing status', () => {
    const result = RtwApiResponseSchema.safeParse({ code: 200 });
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be absent', () => {
    const result = RtwApiResponseSchema.safeParse({
      code: 200,
      status: { outcome: 'NOT_FOUND' }
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status.name).toBeUndefined();
      expect(result.data.status.expiry_date).toBeUndefined();
    }
  });
});

describe('validateRtwVerify helper', () => {
  it('returns success:true with parsed data for valid input', () => {
    const result = validateRtwVerify({
      code: 'W1234567',
      dob: '07-09-1999',
      forename: 'John',
      surname: 'Doe'
    });
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.errors).toBeNull();
  });

  it('returns success:false with field errors for invalid input', () => {
    const result = validateRtwVerify({ code: '', dob: '', forename: '', surname: '' });
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors).not.toBeNull();
    expect(result.errors).toHaveProperty('code');
  });

  it('returns the code error when share code does not start with W', () => {
    const result = validateRtwVerify({
      code: 'R9999999',
      dob: '01-01-2000',
      forename: 'Jane',
      surname: 'Smith'
    });
    expect(result.success).toBe(false);
    expect(result.errors?.code).toMatch(/W/);
  });
});
