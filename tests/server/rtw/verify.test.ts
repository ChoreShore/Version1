import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
  const mockFrom = vi.fn(() => ({ update: mockUpdate }));
  const mockReadBody = vi.fn();
  const mockCreateError = vi.fn((opts: any) => {
    const err = new Error(opts.statusMessage) as any;
    Object.assign(err, opts);
    return err;
  });
  const mockFetch = vi.fn();
  const mockUser = vi.fn();

  (globalThis as any).defineEventHandler = (fn: any) => fn;
  (globalThis as any).readBody = mockReadBody;
  (globalThis as any).createError = mockCreateError;
  (globalThis as any).$fetch = mockFetch;

  return { mockUpdateEq, mockUpdate, mockFrom, mockReadBody, mockCreateError, mockFetch, mockUser };
});

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mocks.mockUser,
  serverSupabaseServiceRole: vi.fn(() => ({ from: mocks.mockFrom })),
}));

import handler from '~/server/api/rtw/verify.post';

const mockEvent = {} as any;

const validBody = {
  code: 'W1234567',
  dob: '07-09-1999',
  forename: 'John',
  surname: 'Doe',
};

const buildApiResponse = (outcome: string, extra: Record<string, any> = {}) => ({
  code: 200,
  status: { outcome, ...extra },
});

describe('POST /api/rtw/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAPIDAPI_KEY = 'test-rapidapi-key';
    mocks.mockUser.mockResolvedValue({ id: 'user-abc' });
    mocks.mockReadBody.mockResolvedValue(validBody);
    mocks.mockFetch.mockResolvedValue(
      buildApiResponse('ACCEPTED', { name: 'JOHN DOE', expiry_date: '30/03/2028' })
    );
    mocks.mockUpdateEq.mockResolvedValue({ error: null });
    mocks.mockUpdate.mockReturnValue({ eq: mocks.mockUpdateEq });
    mocks.mockFrom.mockReturnValue({ update: mocks.mockUpdate });
    mocks.mockCreateError.mockImplementation((opts: any) => {
      const err = new Error(opts.statusMessage) as any;
      Object.assign(err, opts);
      return err;
    });
  });

  describe('authentication', () => {
    it('throws 401 when no user session exists', async () => {
      mocks.mockUser.mockResolvedValue(null);

      await expect(handler(mockEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Sign in to verify your right to work',
      });
    });
  });

  describe('request body validation', () => {
    it('throws 400 when required fields are missing', async () => {
      mocks.mockReadBody.mockResolvedValue({});

      await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when share code does not start with W', async () => {
      mocks.mockReadBody.mockResolvedValue({ ...validBody, code: 'R9999999' });

      await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when dob is not in dd-mm-yyyy format', async () => {
      mocks.mockReadBody.mockResolvedValue({ ...validBody, dob: '1999-09-07' });

      await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('RTW API call', () => {
    it('sends share code, personal details, and company name as query params', async () => {
      await handler(mockEvent);

      const calledUrl = mocks.mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('code=W1234567');
      expect(calledUrl).toContain('forename=John');
      expect(calledUrl).toContain('surname=Doe');
      expect(calledUrl).toContain('company_name=ChoreShore');
    });

    it('sends the RapidAPI key in the request headers', async () => {
      await handler(mockEvent);

      expect(mocks.mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-rapidapi-key': 'test-rapidapi-key' }),
        })
      );
    });

    it('throws 502 when the API response does not match the expected schema', async () => {
      mocks.mockFetch.mockResolvedValue({ unexpected: true });

      await expect(handler(mockEvent)).rejects.toMatchObject({
        statusCode: 502,
        statusMessage: 'Unexpected response from RTW service',
      });
    });
  });

  describe('ACCEPTED outcome', () => {
    it('returns success:true with name and converted expiry_date', async () => {
      const result = await handler(mockEvent);

      expect(result).toEqual({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JOHN DOE',
        expiry_date: '2028-03-30',
      });
    });

    it('converts dd/mm/yyyy expiry_date to yyyy-mm-dd ISO format', async () => {
      mocks.mockFetch.mockResolvedValue(
        buildApiResponse('ACCEPTED', { name: 'JANE SMITH', expiry_date: '01/12/2030' })
      );

      const result = await handler(mockEvent) as any;

      expect(result.expiry_date).toBe('2030-12-01');
    });

    it('returns null expiry_date when omitted from API response', async () => {
      mocks.mockFetch.mockResolvedValue(buildApiResponse('ACCEPTED', { name: 'JOHN DOE' }));

      const result = await handler(mockEvent) as any;

      expect(result.expiry_date).toBeNull();
    });

    it('updates profiles with rtw_status verified and the authenticated user id', async () => {
      await handler(mockEvent);

      expect(mocks.mockFrom).toHaveBeenCalledWith('profiles');
      expect(mocks.mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          rtw_status: 'verified',
          rtw_expiry_date: '2028-03-30',
          rtw_full_name: 'JOHN DOE',
        })
      );
      expect(mocks.mockUpdateEq).toHaveBeenCalledWith('id', 'user-abc');
    });

    it('throws 400 when the profile update returns an error', async () => {
      mocks.mockUpdateEq.mockResolvedValue({ error: { message: 'update failed' } });

      await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('non-ACCEPTED outcomes', () => {
    it.each([
      ['REJECTED', 'right to work could not be confirmed'],
      ['NOT_FOUND', 'Share code not found'],
      ['SHARE_CODE_LOCKED', 'temporarily locked'],
      ['SHARE_CODE_EXPIRED', 'has expired'],
    ])('%s: returns success:false with a relevant message', async (outcome, expectedSnippet) => {
      mocks.mockFetch.mockResolvedValue(buildApiResponse(outcome));

      const result = await handler(mockEvent) as any;

      expect(result.success).toBe(false);
      expect(result.outcome).toBe(outcome);
      expect(result.message).toContain(expectedSnippet);
    });

    it('does not update the profiles table for non-ACCEPTED outcomes', async () => {
      mocks.mockFetch.mockResolvedValue(buildApiResponse('REJECTED'));

      await handler(mockEvent);

      expect(mocks.mockFrom).not.toHaveBeenCalled();
    });
  });
});
