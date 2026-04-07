import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
(globalThis as any).$fetch = mockFetch;

const mockFrom = vi.fn();
const mockSupabaseClient = { from: mockFrom };
const mockUser = { id: 'user-123' };

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: vi.fn(() => ({
    role: { value: 'worker' },
    isWorker: { value: true },
    isEmployer: { value: false },
    setRole: vi.fn()
  }))
}));

(globalThis as any).useSupabaseClient = vi.fn(() => mockSupabaseClient);
(globalThis as any).useSupabaseUser = vi.fn(() => ({ value: mockUser }));

describe('useRtw composable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
    (globalThis as any).useSupabaseClient = vi.fn(() => mockSupabaseClient);
    (globalThis as any).useSupabaseUser = vi.fn(() => ({ value: mockUser }));
  });

  describe('fetchRtwStatus', () => {
    it('sets rtwStatus to verified when profile has verified status', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { rtw_status: 'verified', rtw_expiry_date: '2028-12-31' },
                error: null
              })
          })
        })
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { fetchRtwStatus, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await fetchRtwStatus();

      expect(rtwStatus.value).toBe('verified');
    });

    it('defaults rtwStatus to unverified when profile returns null', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { rtw_status: null, rtw_expiry_date: null }, error: null })
          })
        })
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { fetchRtwStatus, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await fetchRtwStatus();

      expect(rtwStatus.value).toBe('unverified');
    });

    it('sets rtwStatus to unverified when Supabase returns an error', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('DB error') })
          })
        })
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { fetchRtwStatus, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await fetchRtwStatus();

      expect(rtwStatus.value).toBe('unverified');
    });

    it('does not re-fetch if already fetched (cache guard)', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({ data: { rtw_status: 'verified', rtw_expiry_date: null }, error: null })
          })
        })
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { fetchRtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await fetchRtwStatus();
      await fetchRtwStatus();

      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('does nothing when user is not authenticated', async () => {
      (globalThis as any).useSupabaseUser = vi.fn(() => ({ value: null }));

      const { useRtw } = await import('~/composables/useRtw');
      const { fetchRtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await fetchRtwStatus();

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('verify', () => {
    const validPayload = {
      code: 'W1234567',
      dob: '07-09-1999',
      forename: 'John',
      surname: 'Doe'
    };

    it('calls /api/rtw/verify with the correct payload', async () => {
      mockFetch.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JOHN DOE',
        expiry_date: '2028-03-30'
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify } = useRtw();

      await verify(validPayload);

      expect(mockFetch).toHaveBeenCalledWith('/api/rtw/verify', {
        method: 'POST',
        body: validPayload
      });
    });

    it('updates rtwStatus to verified on ACCEPTED response', async () => {
      mockFetch.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JOHN DOE',
        expiry_date: '2028-03-30'
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      await verify(validPayload);

      expect(rtwStatus.value).toBe('verified');
    });

    it('updates rtwExpiryDate on ACCEPTED response', async () => {
      mockFetch.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        name: 'JOHN DOE',
        expiry_date: '2028-03-30'
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwExpiryDate, resetRtwCache } = useRtw();

      resetRtwCache();
      await verify(validPayload);

      expect(rtwExpiryDate.value).toBe('2028-03-30');
    });

    it('returns success:false result on REJECTED outcome without changing status', async () => {
      mockFetch.mockResolvedValue({
        success: false,
        outcome: 'REJECTED',
        message: 'Right to work could not be confirmed.'
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      const result = await verify(validPayload);

      expect(result.success).toBe(false);
      expect(result.outcome).toBe('REJECTED');
      expect(rtwStatus.value).toBe('unverified');
    });

    it('sets rtwLoading to false after verify resolves', async () => {
      mockFetch.mockResolvedValue({ success: false, outcome: 'NOT_FOUND', message: 'Not found.' });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwLoading } = useRtw();

      await verify(validPayload);

      expect(rtwLoading.value).toBe(false);
    });

    it('sets rtwLoading to false even when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwLoading } = useRtw();

      await expect(verify(validPayload)).rejects.toThrow('Network error');
      expect(rtwLoading.value).toBe(false);
    });
  });

  describe('isRtwRequired', () => {
    it('is true when worker role and status is unverified', async () => {
      const { useRtw } = await import('~/composables/useRtw');
      const { isRtwRequired, rtwStatus, resetRtwCache } = useRtw();

      resetRtwCache();
      rtwStatus.value = 'unverified';

      expect(isRtwRequired.value).toBe(true);
    });

    it('is false when status is verified and not expired', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { useRtw } = await import('~/composables/useRtw');
      const { isRtwRequired, rtwStatus, rtwExpiryDate, resetRtwCache } = useRtw();

      resetRtwCache();
      rtwStatus.value = 'verified';
      rtwExpiryDate.value = futureDateStr;

      expect(isRtwRequired.value).toBe(false);
    });

    it('is true when status is verified but expiry date has passed', async () => {
      const { useRtw } = await import('~/composables/useRtw');
      const { isRtwRequired, rtwStatus, rtwExpiryDate, resetRtwCache } = useRtw();

      resetRtwCache();
      rtwStatus.value = 'verified';
      rtwExpiryDate.value = '2020-01-01';

      expect(isRtwRequired.value).toBe(true);
    });
  });

  describe('resetRtwCache', () => {
    it('resets status, expiry and fetched flag', async () => {
      mockFetch.mockResolvedValue({
        success: true,
        outcome: 'ACCEPTED',
        expiry_date: '2028-01-01'
      });

      const { useRtw } = await import('~/composables/useRtw');
      const { verify, rtwStatus, rtwExpiryDate, resetRtwCache } = useRtw();

      await verify({
        code: 'W9999999',
        dob: '01-01-2000',
        forename: 'Jane',
        surname: 'Smith'
      });

      expect(rtwStatus.value).toBe('verified');

      resetRtwCache();

      expect(rtwStatus.value).toBe('unverified');
      expect(rtwExpiryDate.value).toBeNull();
    });
  });
});
