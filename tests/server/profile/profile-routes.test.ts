import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam, getRequestIP } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRouterParam = getRouterParam;
(globalThis as any).getRequestIP = getRequestIP;

const mockRpc = vi.fn();
const mockFrom: any = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      order: vi.fn(() => ({ limit: vi.fn(() => ({ like: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
    })),
    in: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    order: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })),
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

const mockStorageFrom = vi.fn(() => ({
  remove: vi.fn(() => Promise.resolve({ error: null })),
}));

const mockAuthAdmin = { getUserById: vi.fn(() => Promise.resolve({ data: { user: { email_confirmed_at: '2024-01-01' } }, error: null })) };

const mockClient = {
  auth: { admin: mockAuthAdmin },
  from: mockFrom,
  rpc: mockRpc,
  storage: { from: mockStorageFrom },
};

const mockServerSupabaseClient = vi.fn(() => Promise.resolve(mockClient));
const mockServerSupabaseUser: any = vi.fn(() => Promise.resolve({ id: 'user-1', email: 'test@example.com' }));

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
    messages: vi.fn(() => Promise.resolve({})),
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

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Profile Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    mockAuthAdmin.getUserById.mockResolvedValue({ data: { user: { email_confirmed_at: '2024-01-01' } }, error: null });
  });

  describe('GET /api/profile/[username]', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/profile/[username].get');
      handler = imported;
    });

    it('returns profile with worker and employer stats', async () => {
      const profileData = { id: 'u1', username: 'alice', first_name: 'Alice', last_name: 'Smith', bio: 'Hello', photo_url: 'https://example.com/photo.jpg', roles: ['employer', 'worker'], postcode: 'SW1A 1AA', rtw_status: 'verified', created_at: '2024-01-01' };
      let callCount = 0;

      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => {
          callCount++;
          // First from('profiles') call returns the user profile
          if (callCount === 1) {
            return {
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(() => Promise.resolve({ data: profileData, error: null })),
              })),
            };
          }
          return {
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              single: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
            order: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }),
      }));

      const result = await handler(createEvent({ context: { params: { username: 'alice' } } }));
      expect(result.profile.username).toBe('alice');
      expect(result.profile.email_verified).toBe(true);
    });

    it('throws 400 when username is missing', async () => {
      try {
        await handler(createEvent({ context: { params: {} } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Username is required');
      }
    });

    it('throws 404 when profile not found', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      }));

      try {
        await handler(createEvent({ context: { params: { username: 'nonexistent' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe('DELETE /api/profile/photo', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/profile/photo.delete');
      handler = imported;
    });

    it('deletes photo successfully', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { photo_url: 'https://xxx.supabase.co/storage/v1/object/public/profile-photos/worker-photos/user-123.jpg' },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      const result = await handler(createEvent({ method: 'DELETE' }));
      expect(result.success).toBe(true);
    });

    it('throws 400 when no photo exists', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { photo_url: null }, error: null })),
          })),
        })),
      }));

      try {
        await handler(createEvent({ method: 'DELETE' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('No photo to delete');
      }
    });

    it('throws 400 for invalid photo URL format', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { photo_url: 'https://example.com/invalid.jpg' },
              error: null,
            })),
          })),
        })),
      }));

      try {
        await handler(createEvent({ method: 'DELETE' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Invalid photo URL format');
      }
    });
  });
});
