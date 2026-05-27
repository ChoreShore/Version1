import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRouterParam = getRouterParam;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockFrom: any = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      order: vi.fn(() => ({ limit: vi.fn(() => ({ like: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
    })),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
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

const mockRpc = vi.fn();
const mockClient = {
  from: mockFrom,
  rpc: mockRpc,
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
    jobCreation: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Jobs Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/jobs/categories', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/jobs/categories.get');
      handler = imported;
    });

    it('returns job categories list', async () => {
      const categories = [
        { id: 'cat-1', name: 'Gardening', description: 'Garden work', created_at: '2024-01-01', is_active: true },
        { id: 'cat-2', name: 'Cleaning', description: null, created_at: '2024-01-02', is_active: true },
      ];
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: categories, error: null })),
        })),
      }));

      const result = await handler(createEvent());
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Gardening');
    });

    it('throws 400 on database error', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'connection failed' } })),
        })),
      }));

      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('GET /api/jobs/near', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/jobs/near.get');
      handler = imported;
    });

    it('returns nearby jobs for valid coordinates', async () => {
      const jobs = [{ job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890', title: 'Gardening', postcode_area: 'SW1A', distance_km: 2.5 }];
      mockRpc.mockResolvedValue({ data: jobs, error: null });

      const result = await handler(createEvent({ query: { lat: '51.5', lng: '-0.1' } }));
      expect(result.jobs).toHaveLength(1);
    });

    it('throws 400 when lat is missing', async () => {
      try {
        await handler(createEvent({ query: { lng: '-0.1' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 400 when lat is out of range', async () => {
      try {
        await handler(createEvent({ query: { lat: '95', lng: '-0.1' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 400 when lng is out of range', async () => {
      try {
        await handler(createEvent({ query: { lat: '51.5', lng: '-200' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 400 when distance is out of range', async () => {
      try {
        await handler(createEvent({ query: { lat: '51.5', lng: '-0.1', distance: '2000' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('GET /api/jobs/[id]', () => {
    let handler: any;

    beforeEach(async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      const { default: imported } = await import('~/server/api/jobs/[id].get');
      handler = imported;
    });

    it('returns job for owner', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const job = { id: jobId, employer_id: 'user-1', status: 'open', title: 'Gardening' };
      const fullJob = {
        id: jobId,
        employer_id: 'user-1',
        title: 'Gardening',
        description: 'Weed garden',
        category_id: 'cat-1',
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2024-12-31',
        status: 'open',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        application_count: 0,
        category: { name: 'Gardening' },
        employer: { first_name: 'Alice', last_name: 'Smith' },
      };
      let callCount = 0;
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => {
          callCount++;
          return {
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: callCount === 1 ? job : fullJob, error: null })),
            })),
          };
        }),
      }));

      const result = await handler(createEvent({ context: { params: { id: jobId } } }));
      expect(result.job.id).toBe(jobId);
    });

    it('throws 404 for non-existent job', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'not found' } })),
          })),
        })),
      }));

      try {
        await handler(createEvent({ context: { params: { id: jobId } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });

    it('throws 403 when non-owner tries to view non-open job', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892';
      const job = { id: jobId, employer_id: 'other-user', status: 'filled' };
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: job, error: null })),
          })),
        })),
      }));

      try {
        await handler(createEvent({ context: { params: { id: jobId } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });
  });
});
