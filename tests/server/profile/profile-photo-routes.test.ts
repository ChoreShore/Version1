import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, readFormData, getRequestHeader, getRequestURL } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).readFormData = vi.fn(() => Promise.resolve({
  get: (key: string) => key === 'photo' ? { name: 'test.jpg', type: 'image/jpeg', size: 1000 } : null,
}));
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
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

vi.mock('~/schemas/profile', () => ({
  validatePhotoUpload: vi.fn(() => ({ success: true, data: { photo: { name: 'test.jpg', type: 'image/jpeg', size: 1000 } }, errors: null })),
  PhotoUploadSchema: {},
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Profile Photo Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('POST /api/profile/photo', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/profile/photo.post');
      handler = imported;
    });

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

      const result = await handler(createEvent({ method: 'POST' }));
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

      const result = await handler(createEvent({ method: 'POST' }));
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

      try {
        await handler(createEvent({ method: 'POST' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toBe('Profile not found');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ method: 'POST' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
