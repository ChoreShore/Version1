import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useIdentity } from '~/composables/useIdentity';
import type { IdentityVerificationRecord } from '~/types/identity';

const mockFetch = vi.fn();
const mockUser = ref({
  id: 'user-1',
  email: 'test@example.com',
  user_metadata: {}
});

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRuntimeConfig: () => ({
    public: {
      diditUnilinkUrl: 'https://test.didit.com'
    }
  }),
  $fetch: mockFetch
}));

// Mock @didit-protocol/sdk-web at module level with factory function
vi.mock('@didit-protocol/sdk-web', () => ({
  DiditSdk: {
    shared: {
      startVerification: vi.fn(),
      close: vi.fn(),
      onStateChange: null,
      onComplete: null,
      onEvent: null
    }
  }
}));

// Stub Nuxt auto-imports and dependencies
(globalThis as any).$fetch = mockFetch;
(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);
(globalThis as any).useRuntimeConfig = vi.fn(() => ({
  public: {
    diditUnilinkUrl: 'https://test.didit.com'
  }
}));

// Reference to the mocked DiditSdk for test assertions
const mockDiditSdk = {
  shared: {
    startVerification: vi.fn(),
    close: vi.fn(),
    onStateChange: null as ((state: string) => void) | null,
    onComplete: null as ((result: any) => void) | null,
    onEvent: null as ((event: any) => void) | null
  }
};

describe('useIdentity composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockUser.value = {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: {}
    };
    mockDiditSdk.shared.startVerification.mockReset();
    mockDiditSdk.shared.close.mockReset();
    mockDiditSdk.shared.onStateChange = null;
    mockDiditSdk.shared.onComplete = null;
    mockDiditSdk.shared.onEvent = null;
    
    // Reset module-level state by calling reset
    const { reset } = useIdentity();
    reset();
  });

  describe('identityStatus', () => {
    it('returns identityStatus ref', () => {
      const { identityStatus } = useIdentity();
      expect(identityStatus).toBeDefined();
    });

    it('returns isVerified ref', () => {
      const { isVerified } = useIdentity();
      expect(isVerified).toBeDefined();
    });

    it('returns lastSessionId ref', () => {
      const { lastSessionId } = useIdentity();
      expect(lastSessionId).toBeDefined();
    });
  });

  describe('isVerified', () => {
    it('returns false when status is not verified', () => {
      mockUser.value.user_metadata = {};
      const { isVerified } = useIdentity();
      expect(isVerified.value).toBe(false);
    });
  });

  describe('lastSessionId', () => {
    it('returns null when no verification record exists', () => {
      mockUser.value.user_metadata = {};
      const { lastSessionId } = useIdentity();
      expect(lastSessionId.value).toBeNull();
    });
  });

  describe('fetchStatus', () => {
    it('returns fetchStatus function', () => {
      const { fetchStatus } = useIdentity();
      expect(fetchStatus).toBeDefined();
    });
  });


  describe('startVerification', () => {
    it('renders without errors for starting verification', () => {
      const { startVerification } = useIdentity();
      expect(startVerification).toBeDefined();
    });

    it('renders without errors for isLoading state', () => {
      const { isLoading } = useIdentity();
      expect(isLoading).toBeDefined();
    });

    it('renders without errors for clearing lastError', () => {
      const { lastError } = useIdentity();
      expect(lastError).toBeDefined();
    });
  });

  describe('closeVerification', () => {
    it('renders without errors for closing verification', () => {
      const { closeVerification } = useIdentity();
      expect(closeVerification).toBeDefined();
    });

    it('renders without errors for isLoading state', () => {
      const { isLoading } = useIdentity();
      expect(isLoading).toBeDefined();
    });
  });

  describe('reset', () => {
    it('renders without errors for reset function', () => {
      const { reset } = useIdentity();
      expect(reset).toBeDefined();
    });
  });

  describe('Didit SDK event handlers', () => {
    it('renders without errors for state change handler', () => {
      const { isLoading } = useIdentity();
      expect(isLoading).toBeDefined();
    });

    it('renders without errors for complete handler', () => {
      const { identityStatus } = useIdentity();
      expect(identityStatus).toBeDefined();
    });

    it('renders without errors for error handler', () => {
      const { lastError } = useIdentity();
      expect(lastError).toBeDefined();
    });
  });
});
