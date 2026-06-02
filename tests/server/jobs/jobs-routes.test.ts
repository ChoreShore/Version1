import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
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
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/geocoding', () => ({
  geocodePostcode: vi.fn(() => Promise.resolve({ success: true, latitude: 51.5, longitude: -0.1 })),
  clearGeocodingCache: vi.fn(),
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

  describe('GET /api/jobs (index.get)', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/jobs/index.get');
      handler = imported;
    });

    it('returns preview jobs for anonymous user', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);
      const previewJobs = [
        { id: 'job-1', title: 'Gardening', description: 'Weed garden', category_id: 'cat-1', postcode: 'SW1A 1AA', budget_type: 'fixed', created_at: '2024-01-01', category: { name: 'Gardening' } },
      ];
      const mockClient = createSupabaseMock({
        from: { jobs: { select: previewJobs } },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.preview_mode).toBe(true);
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe('Gardening');
    });

    it('returns own jobs for authenticated employer', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
          jobs: {
            select: [
              { id: 'job-1', title: 'My Job', employer_id: 'user-1', status: 'open', created_at: '2024-01-01', updated_at: '2024-01-01', description: 'Test job', category_id: 'cat-1', postcode: 'SW1A 1AA', budget_type: 'fixed', budget_amount: 100, deadline: '2024-12-31', category: { name: 'Gardening' }, employer: { first_name: 'Alice', last_name: 'Smith' } },
            ],
          },
          applications: { select: [{ job_id: 'job-1' }, { job_id: 'job-1' }, { job_id: 'job-1' }] },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.preview_mode).toBe(false);
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].application_count).toBe(3);
    });

    it('returns open jobs from other employers for authenticated worker', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'worker-1', roles: ['worker'] } },
          jobs: {
            select: [
              { id: 'job-2', title: 'Other Job', employer_id: 'other-user', status: 'open', created_at: '2024-01-01', updated_at: '2024-01-01', description: 'Test job', category_id: 'cat-2', postcode: 'SW1A 1AA', budget_type: 'fixed', budget_amount: 100, deadline: '2024-12-31', category: { name: 'Cleaning' }, employer: { first_name: 'Bob', last_name: 'Jones' } },
            ],
          },
          applications: { count: 0 },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe('Other Job');
    });

    it('filters by scope=mine for employer', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer', 'worker'] } },
          jobs: {
            select: [
              { id: 'job-3', title: 'Mine', employer_id: 'user-1', status: 'open', created_at: '2024-01-01', updated_at: '2024-01-01', description: 'Test job', category_id: 'cat-1', postcode: 'SW1A 1AA', budget_type: 'fixed', budget_amount: 100, deadline: '2024-12-31', category: { name: 'Gardening' }, employer: { first_name: 'Alice', last_name: 'Smith' } },
            ],
          },
          applications: { count: 1 },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ query: { scope: 'mine' } }));
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe('Mine');
    });

    it('filters by category and postcode', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
          jobs: {
            select: [
              { id: 'job-4', title: 'Filtered', employer_id: 'user-1', status: 'open', created_at: '2024-01-01', updated_at: '2024-01-01', description: 'Test job', category_id: 'cat-1', postcode: 'SW1A 1AA', budget_type: 'fixed', budget_amount: 100, deadline: '2024-12-31', category: { name: 'Gardening' }, employer: { first_name: 'Alice', last_name: 'Smith' } },
            ],
          },
          applications: { count: 0 },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ query: { category: 'cat-1', postcode: 'SW1A' } }));
      expect(result.jobs).toHaveLength(1);
    });
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
      const mockClient = createSupabaseMock({
        from: { job_categories: { select: categories } },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].name).toBe('Gardening');
    });

    it('throws 400 on database error', async () => {
      const mockClient = createSupabaseMock({
        from: { job_categories: { error: { message: 'connection failed' } } },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

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
      const mockClient = createSupabaseMock({
        rpc: { find_jobs_near: jobs },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

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
      let callIndex = 0;
      const mockClient = createSupabaseMock({
        from: {
          jobs: {
            select: callIndex++ === 0 ? [job] : [fullJob],
          },
        },
      });
      // Override: the route calls single() on jobs, not select array
      // We need a smarter mock that distinguishes calls
      mockServerSupabaseClient.mockImplementation(async () => {
        const idx = callIndex++;
        return createSupabaseMock({
          from: {
            jobs: {
              single: idx === 0 ? job : fullJob,
            },
          },
        });
      });

      const result = await handler(createEvent({ context: { params: { id: jobId } } }));
      expect(result.job.id).toBe(jobId);
    });

    it('throws 404 for non-existent job', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: null, error: { message: 'not found' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

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
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: job },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ context: { params: { id: jobId } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });
  });

  describe('POST /api/jobs (index.post)', () => {
    let handler: any;
    const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const validJobBody = {
      title: 'Garden Help Needed',
      description: 'Need someone to weed my garden and trim hedges. About 3 hours work.',
      category_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
      postcode: 'SW1A 1AA',
      budget_type: 'fixed',
      budget_amount: 150,
      deadline: futureDeadline,
      estimated_hours: 3,
      is_recurring: false
    };
    const createdJob = {
      id: 'job-new-1',
      employer_id: 'user-1',
      title: validJobBody.title,
      description: validJobBody.description,
      category_id: validJobBody.category_id,
      postcode: validJobBody.postcode,
      budget_type: validJobBody.budget_type,
      budget_amount: validJobBody.budget_amount,
      deadline: validJobBody.deadline,
      estimated_hours: validJobBody.estimated_hours,
      is_recurring: validJobBody.is_recurring,
      status: 'open',
      latitude: 51.5,
      longitude: -0.1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      category: { name: 'Gardening' },
      employer: { first_name: 'Alice', last_name: 'Smith' }
    };

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/jobs/index.post');
      handler = imported;
    });

    it('creates a job for authenticated employer', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
          job_categories: { single: { id: validJobBody.category_id } },
          jobs: { insertSingle: createdJob },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'POST', body: validJobBody }));
      expect(result.job.id).toBe('job-new-1');
      expect(result.job.status).toBe('open');
    });

    it('rejects when user is not an employer', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['worker'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: validJobBody }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.statusMessage).toContain('Only employers can create jobs');
      }
    });

    it('rejects invalid category', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1' });
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
          job_categories: { single: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: validJobBody }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Invalid category ID');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ method: 'POST', body: validJobBody }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ method: 'POST', body: { title: '' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Validation failed');
      }
    });
  });
});
