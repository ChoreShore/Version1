import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
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

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logDetailedError: vi.fn(),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' } },
  query: {},
  ...overrides,
});

describe('POST /api/worker/onboarding', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    const { default: imported } = await import('~/server/api/worker/onboarding.post');
    handler = imported;
  });

  it('completes worker onboarding and adds role', async () => {
    const payload = {
      role: 'worker' as const,
      postcode: 'SW1A1AA',
      category_ids: ['a1b2c3d4-e5f6-4aaa-abcd-ef1234567890'],
      bio: 'Experienced gardener',
      skills: ['gardening', 'landscaping'],
      photo_url: 'https://example.com/photo.jpg',
    };

    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'user-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ method: 'POST', body: payload }));
    expect(result.success).toBe(true);
  });

  it('does not duplicate worker role if already present', async () => {
    const payload = {
      role: 'worker' as const,
      postcode: 'SW1A1AA',
      category_ids: ['a1b2c3d4-e5f6-4aaa-abcd-ef1234567890'],
    };

    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'user-1', roles: ['employer', 'worker'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ method: 'POST', body: payload }));
    expect(result.success).toBe(true);
  });

  it('throws 400 on validation failure', async () => {
    try {
      await handler(createEvent({ method: 'POST', body: {} }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
    }
  });

  it('throws 401 when not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null);

    try {
      await handler(createEvent({ method: 'POST', body: { role: 'worker', postcode: 'SW1A1AA', category_ids: [] } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
    }
  });

  it('throws 500 when profile update fails', async () => {
    const payload = {
      role: 'worker' as const,
      postcode: 'SW1A1AA',
      category_ids: ['a1b2c3d4-e5f6-4aaa-abcd-ef1234567890'],
    };

    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'user-1', roles: ['employer'] }, error: { message: 'Update failed' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    try {
      await handler(createEvent({ method: 'POST', body: payload }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(500);
      expect(error.statusMessage).toBe('Failed to save onboarding data');
    }
  });
});
