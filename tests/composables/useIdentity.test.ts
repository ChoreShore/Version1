import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref } from 'vue';
import { useIdentity } from '~/composables/useIdentity';

const mockFetch = vi.fn();
const mockUser = ref<any>({
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {}
});

const { mockDiditShared } = vi.hoisted(() => ({
  mockDiditShared: {
    startVerification: vi.fn(),
    close: vi.fn(),
    onStateChange: null as ((state: string) => void) | null,
    onComplete: null as ((result: any) => void) | null,
    onEvent: null as ((event: any) => void) | null
  }
}));

vi.mock('@didit-protocol/sdk-web', () => ({
  DiditSdk: { shared: mockDiditShared }
}));

let originalUseSupabaseUser: any;
let originalUseRuntimeConfig: any;
let originalFetch: any;

beforeEach(() => {
  originalUseSupabaseUser = (globalThis as any).useSupabaseUser;
  originalUseRuntimeConfig = (globalThis as any).useRuntimeConfig;
  originalFetch = (globalThis as any).$fetch;

  (globalThis as any).useSupabaseUser = () => mockUser;
  (globalThis as any).useRuntimeConfig = () => ({
    public: { diditUnilinkUrl: 'https://test.didit.com' }
  });
  (globalThis as any).$fetch = mockFetch;

  mockFetch.mockReset();
  mockUser.value = { id: 'user-1', email: 'test@example.com', user_metadata: {} };
  mockDiditShared.startVerification.mockReset();
  mockDiditShared.close.mockReset();
  mockDiditShared.onStateChange = null;
  mockDiditShared.onComplete = null;
  mockDiditShared.onEvent = null;
  const { reset } = useIdentity();
  reset();
});

afterEach(() => {
  (globalThis as any).useSupabaseUser = originalUseSupabaseUser;
  (globalThis as any).useRuntimeConfig = originalUseRuntimeConfig;
  (globalThis as any).$fetch = originalFetch;
});

describe('useIdentity composable', () => {
  describe('initial state', () => {
    it('starts with identityStatus "unverified"', () => {
      const { identityStatus } = useIdentity();
      expect(identityStatus.value).toBe('unverified');
    });

    it('starts with isLoading false', () => {
      const { isLoading } = useIdentity();
      expect(isLoading.value).toBe(false);
    });

    it('starts with lastSessionId null', () => {
      const { lastSessionId } = useIdentity();
      expect(lastSessionId.value).toBeNull();
    });

    it('starts with lastError null', () => {
      const { lastError } = useIdentity();
      expect(lastError.value).toBeNull();
    });
  });

  describe('isVerified', () => {
    it('is false when identityStatus is "unverified"', () => {
      const { isVerified } = useIdentity();
      expect(isVerified.value).toBe(false);
    });

    it('is true when identityStatus is "verified"', () => {
      const { identityStatus, isVerified } = useIdentity();
      identityStatus.value = 'verified';
      expect(isVerified.value).toBe(true);
    });
  });

  describe('fetchStatus', () => {
    it('sets identityStatus from user metadata', () => {
      mockUser.value.user_metadata = {
        identity_verification: { status: 'verified', sessionId: 'sess-123' }
      };
      const { fetchStatus, identityStatus } = useIdentity();
      fetchStatus();
      expect(identityStatus.value).toBe('verified');
    });

    it('sets lastSessionId from user metadata', () => {
      mockUser.value.user_metadata = {
        identity_verification: { status: 'verified', sessionId: 'sess-123' }
      };
      const { fetchStatus, lastSessionId } = useIdentity();
      fetchStatus();
      expect(lastSessionId.value).toBe('sess-123');
    });

    it('defaults to "unverified" when no metadata', () => {
      mockUser.value.user_metadata = {};
      const { fetchStatus, identityStatus } = useIdentity();
      fetchStatus();
      expect(identityStatus.value).toBe('unverified');
    });

    it('defaults to null sessionId when no metadata', () => {
      mockUser.value.user_metadata = {};
      const { fetchStatus, lastSessionId } = useIdentity();
      fetchStatus();
      expect(lastSessionId.value).toBeNull();
    });

    it('handles null user_metadata', () => {
      mockUser.value.user_metadata = null;
      const { fetchStatus, identityStatus } = useIdentity();
      fetchStatus();
      expect(identityStatus.value).toBe('unverified');
    });
  });

  describe('startVerification', () => {
    it('sets isLoading to true', async () => {
      const { startVerification, isLoading } = useIdentity();
      startVerification();
      expect(isLoading.value).toBe(true);
    });

    it('clears lastError', async () => {
      const { startVerification, lastError } = useIdentity();
      lastError.value = 'previous error';
      startVerification();
      expect(lastError.value).toBeNull();
    });

    it('calls DiditSdk.startVerification with url and config', async () => {
      const { startVerification } = useIdentity();
      startVerification();
      expect(mockDiditShared.startVerification).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://test.didit.com',
        configuration: expect.objectContaining({ closeModalOnComplete: false })
      }));
    });

    it('throws and sets lastError when diditUnilinkUrl is missing', async () => {
      (globalThis as any).useRuntimeConfig = () => ({ public: { diditUnilinkUrl: '' } });
      const { startVerification, lastError, isLoading } = useIdentity();
      await expect(startVerification()).rejects.toThrow('DIDIT_UNILINK_URL');
      expect(lastError.value).toBe('Didit is not configured');
      expect(isLoading.value).toBe(false);
      (globalThis as any).useRuntimeConfig = () => ({
        public: { diditUnilinkUrl: 'https://test.didit.com' }
      });
    });
  });

  describe('closeVerification', () => {
    it('calls DiditSdk.close', () => {
      const { closeVerification } = useIdentity();
      closeVerification();
      expect(mockDiditShared.close).toHaveBeenCalled();
    });

    it('sets isLoading to false', () => {
      const { closeVerification, isLoading } = useIdentity();
      isLoading.value = true;
      closeVerification();
      expect(isLoading.value).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets identityStatus to "unverified"', () => {
      const { reset, identityStatus } = useIdentity();
      identityStatus.value = 'verified';
      reset();
      expect(identityStatus.value).toBe('unverified');
    });

    it('resets lastSessionId to null', () => {
      const { reset, lastSessionId } = useIdentity();
      lastSessionId.value = 'sess-1';
      reset();
      expect(lastSessionId.value).toBeNull();
    });

    it('resets lastError to null', () => {
      const { reset, lastError } = useIdentity();
      lastError.value = 'some error';
      reset();
      expect(lastError.value).toBeNull();
    });

    it('resets isLoading to false', () => {
      const { reset, isLoading } = useIdentity();
      isLoading.value = true;
      reset();
      expect(isLoading.value).toBe(false);
    });
  });
});
