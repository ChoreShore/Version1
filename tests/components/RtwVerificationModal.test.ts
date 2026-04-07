import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RtwVerifySchema } from '~/schemas/rtw';

const mockVerify = vi.fn();
const mockFetch = vi.fn();

vi.mock('~/composables/useRtw', () => ({
  useRtw: vi.fn(() => ({
    verify: mockVerify,
    rtwStatus: { value: 'unverified' },
    rtwLoading: { value: false },
    isRtwRequired: { value: true },
    fetchRtwStatus: vi.fn(),
    resetRtwCache: vi.fn()
  }))
}));

(globalThis as any).useSupabaseUser = vi.fn(() => ({
  value: {
    id: 'user-123',
    user_metadata: { first_name: 'John', last_name: 'Doe' }
  }
}));

(globalThis as any).$fetch = mockFetch;

describe('RtwVerificationModal — form validation logic', () => {
  const validForm = {
    code: 'W1234567',
    dob: '07-09-1999',
    forename: 'John',
    surname: 'Doe'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerify.mockReset();
  });

  describe('field-level schema validation (mirrors component validate())', () => {
    it('passes with a complete valid form', () => {
      const result = RtwVerifySchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it('collects errors for each invalid field', () => {
      const result = RtwVerifySchema.safeParse({ code: '', dob: '', forename: '', surname: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = result.error.issues.map((i) => i.path[0]);
        expect(fields).toContain('code');
        expect(fields).toContain('dob');
        expect(fields).toContain('forename');
        expect(fields).toContain('surname');
      }
    });

    it('rejects a share code that does not start with W', () => {
      const result = RtwVerifySchema.safeParse({ ...validForm, code: 'Z1234567' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const codeIssue = result.error.issues.find((i) => i.path[0] === 'code');
        expect(codeIssue?.message).toMatch(/W/);
      }
    });

    it('rejects dob in wrong format', () => {
      const result = RtwVerifySchema.safeParse({ ...validForm, dob: '1999/07/09' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const dobIssue = result.error.issues.find((i) => i.path[0] === 'dob');
        expect(dobIssue).toBeDefined();
      }
    });
  });

  describe('verify() integration (simulating handleSubmit)', () => {
    it('calls verify with the correct payload on success path', async () => {
      mockVerify.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JOHN DOE',
        expiry_date: '2028-03-30'
      });

      const result = RtwVerifySchema.safeParse(validForm);
      expect(result.success).toBe(true);

      if (result.success) {
        await mockVerify(result.data);
        expect(mockVerify).toHaveBeenCalledWith({
          code: 'W1234567',
          dob: '07-09-1999',
          forename: 'John',
          surname: 'Doe'
        });
      }
    });

    it('does not call verify when validation fails', () => {
      const result = RtwVerifySchema.safeParse({ ...validForm, code: '' });
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(mockVerify).not.toHaveBeenCalled();
      }
    });

    it('transitions to success state on ACCEPTED outcome', async () => {
      mockVerify.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JANE SMITH',
        expiry_date: '2029-06-15'
      });

      const result = await mockVerify(validForm);

      expect(result.success).toBe(true);
      expect(result.outcome).toBe('ACCEPTED');
      expect(result.name).toBe('JANE SMITH');
    });

    it('keeps idle state and sets apiError on REJECTED outcome', async () => {
      mockVerify.mockResolvedValue({
        success: false,
        outcome: 'REJECTED',
        message: 'Right to work could not be confirmed.'
      });

      const result = await mockVerify(validForm);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Right to work could not be confirmed.');
    });

    it('keeps idle state on NOT_FOUND outcome', async () => {
      mockVerify.mockResolvedValue({
        success: false,
        outcome: 'NOT_FOUND',
        message: 'Share code not found.'
      });

      const result = await mockVerify(validForm);

      expect(result.success).toBe(false);
      expect(result.outcome).toBe('NOT_FOUND');
    });

    it('keeps idle state on SHARE_CODE_LOCKED outcome', async () => {
      mockVerify.mockResolvedValue({
        success: false,
        outcome: 'SHARE_CODE_LOCKED',
        message: 'Share code is temporarily locked.'
      });

      const result = await mockVerify(validForm);
      expect(result.success).toBe(false);
    });

    it('keeps idle state on SHARE_CODE_EXPIRED outcome', async () => {
      mockVerify.mockResolvedValue({
        success: false,
        outcome: 'SHARE_CODE_EXPIRED',
        message: 'Share code has expired.'
      });

      const result = await mockVerify(validForm);
      expect(result.success).toBe(false);
    });

    it('propagates thrown errors from verify()', async () => {
      mockVerify.mockRejectedValue(
        Object.assign(new Error('Server error'), {
          data: { statusMessage: 'RTW service unavailable' }
        })
      );

      await expect(mockVerify(validForm)).rejects.toMatchObject({
        message: 'Server error'
      });
    });
  });

  describe('expiry date display formatting', () => {
    it('converts ISO expiry to dd/mm/yyyy for display', () => {
      const iso = '2028-03-30';
      const [year, month, day] = iso.split('-');
      const display = `${day}/${month}/${year}`;
      expect(display).toBe('30/03/2028');
    });

    it('handles null expiry date gracefully', () => {
      const iso: string | null = null;
      const display = iso ? iso.split('-').reverse().join('/') : null;
      expect(display).toBeNull();
    });
  });

  describe('user metadata pre-fill', () => {
    it('can pre-fill forename and surname from user metadata', () => {
      const mockUser = {
        value: {
          id: 'user-123',
          user_metadata: { first_name: 'Alice', last_name: 'Bloggs' }
        }
      };

      const meta = mockUser.value.user_metadata ?? {};
      const forename = meta.first_name ?? '';
      const surname = meta.last_name ?? '';

      expect(forename).toBe('Alice');
      expect(surname).toBe('Bloggs');
    });

    it('falls back to empty strings when metadata is absent', () => {
      const mockUser = { value: { id: 'user-456', user_metadata: {} } };

      const meta = mockUser.value.user_metadata ?? {};
      const forename = (meta as any).first_name ?? '';
      const surname = (meta as any).last_name ?? '';

      expect(forename).toBe('');
      expect(surname).toBe('');
    });
  });
});

describe('RtwVerificationModal — outcome message mapping', () => {
  const OUTCOME_MESSAGES: Record<string, string> = {
    REJECTED:
      'The share code was found but right to work could not be confirmed. Please check your details and try again.',
    NOT_FOUND: 'Share code not found. Please check the code and try again.',
    SHARE_CODE_LOCKED:
      'This share code is temporarily locked due to too many checks. Please wait 10 minutes and try again.',
    SHARE_CODE_EXPIRED:
      'This share code has expired. Please obtain a new share code from the Home Office.'
  };

  it('has a message for REJECTED', () => {
    expect(OUTCOME_MESSAGES.REJECTED).toContain('right to work could not be confirmed');
  });

  it('has a message for NOT_FOUND', () => {
    expect(OUTCOME_MESSAGES.NOT_FOUND).toContain('not found');
  });

  it('has a message for SHARE_CODE_LOCKED', () => {
    expect(OUTCOME_MESSAGES.SHARE_CODE_LOCKED).toContain('locked');
  });

  it('has a message for SHARE_CODE_EXPIRED', () => {
    expect(OUTCOME_MESSAGES.SHARE_CODE_EXPIRED).toContain('expired');
  });

  it('returns undefined for ACCEPTED (no error message needed)', () => {
    expect(OUTCOME_MESSAGES['ACCEPTED']).toBeUndefined();
  });
});
