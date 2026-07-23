import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defineEventHandler,
  createError,
  readBody,
  readFormData,
  getRequestHeader,
  getRequestURL,
  getQuery,
  getRouterParam,
} from 'h3';
import { createSupabaseMock } from '../mocks/createSupabaseMock';
import { createIntegrationFetch } from '../helpers/integration';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).readFormData = readFormData;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRouterParam = getRouterParam;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockServerSupabaseClient = vi.fn();
const mockServerSupabaseUser: any = vi.fn();

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: mockServerSupabaseClient,
  serverSupabaseUser: mockServerSupabaseUser,
}));

vi.mock('~/server/utils/csrf', () => ({
  requireCsrfProtection: vi.fn(),
  validateOrigin: vi.fn(),
}));

vi.mock('~/server/utils/rateLimit', () => ({
  rateLimiters: {
    general: vi.fn(() => Promise.resolve({})),
    auth: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logDetailedError: vi.fn(),
}));

describe('Profile Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  describe('PATCH /api/profile/bio', () => {
    it('updates bio for authenticated worker', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['worker'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await (globalThis as any).$fetch('/api/profile/bio', {
        method: 'PATCH',
        body: { bio: 'I am a skilled gardener with 10 years of experience.' },
      });

      expect(result.success).toBe(true);
      expect(result.bio).toBe('I am a skilled gardener with 10 years of experience.');
    });

    it('rejects bio update for non-worker', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      await expect(
        (globalThis as any).$fetch('/api/profile/bio', {
          method: 'PATCH',
          body: { bio: 'My bio' },
        })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('rejects unauthenticated user', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      await expect(
        (globalThis as any).$fetch('/api/profile/bio', {
          method: 'PATCH',
          body: { bio: 'My bio' },
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('returns validation error for bio exceeding 500 characters', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['worker'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      await expect(
        (globalThis as any).$fetch('/api/profile/bio', {
          method: 'PATCH',
          body: { bio: 'a'.repeat(501) },
        })
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('POST /api/profile/photo', () => {
    it('uploads photo for authenticated worker', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['worker'] } },
        },
        storage: {
          from: {
            'profile-photos': {
              upload: { data: { path: 'worker-photos/user-1/1234567890.jpg' }, error: null },
              getPublicUrl: { data: { publicUrl: 'https://example.com/photos/user-1.jpg' } },
            },
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await (globalThis as any).$fetch('/api/profile/photo', {
        method: 'POST',
        body: { photo: 'dummy' },
      });

      expect(result.success).toBe(true);
      expect(result.photoUrl).toBe('https://example.com/photos/user-1.jpg');
    });

    it('uploads photo for authenticated employer', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
        },
        storage: {
          from: {
            'profile-photos': {
              upload: { data: { path: 'employer-photos/user-1/1234567890.jpg' }, error: null },
              getPublicUrl: { data: { publicUrl: 'https://example.com/photos/user-1.jpg' } },
            },
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await (globalThis as any).$fetch('/api/profile/photo', {
        method: 'POST',
        body: { photo: 'dummy' },
      });

      expect(result.success).toBe(true);
      expect(result.path).toContain('employer-photos');
    });

    it('throws 404 when profile not found', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: null, error: { message: 'not found' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      await expect(
        (globalThis as any).$fetch('/api/profile/photo', {
          method: 'POST',
          body: { photo: 'dummy' },
        })
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      await expect(
        (globalThis as any).$fetch('/api/profile/photo', {
          method: 'POST',
          body: { photo: 'dummy' },
        })
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });
});
