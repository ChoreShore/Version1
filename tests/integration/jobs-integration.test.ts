import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam } from 'h3';
import { createSupabaseMock } from '../mocks/createSupabaseMock';
import { createIntegrationFetch } from '../helpers/integration';

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

describe('Jobs Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('lists jobs end-to-end', async () => {
    const jobs = [
      {
        id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        employer_id: 'user-1',
        title: 'Gardening',
        description: 'Weed garden',
        category_id: 'cat-1',
        postcode: 'SW1A 1AA',
        latitude: null,
        longitude: null,
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2099-12-31',
        status: 'open',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];
    const mockClient = createSupabaseMock({
      from: {
        jobs: { select: jobs },
        profiles: { single: { id: 'user-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { listJobs } = useJobs();
    const result = await listJobs();

    expect(result.jobs).toHaveLength(1);
    expect(result.jobs[0].title).toBe('Gardening');
  });

  it('creates a job end-to-end', async () => {
    const mockClient = createSupabaseMock({
      from: {
        job_categories: { select: [{ id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', name: 'Gardening' }], single: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899' } },
        jobs: {
          insertSingle: {
            id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
            employer_id: 'user-1',
            title: 'New Job',
            description: 'Clean garden',
            category_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
            postcode: 'SW1A 1AA',
            latitude: 51.5,
            longitude: -0.1,
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2099-12-31',
            status: 'open',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
        profiles: { single: { id: 'user-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { createJob } = useJobs();
    const result = await createJob({
      title: 'New Job',
      description: 'Clean garden',
      category_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
      postcode: 'SW1A 1AA',
      budget_type: 'fixed',
      budget_amount: 100,
      deadline: '2099-12-31',
    } as any);

    expect(result.job.title).toBe('New Job');
  });

  it('returns validation error for invalid job payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'user-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { createJob } = useJobs();

    try {
      await createJob({ title: '' } as any);
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
    }
  });

  it('gets a job by id end-to-end', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const mockClient = createSupabaseMock({
      from: {
        jobs: {
          single: {
            id: jobId,
            employer_id: 'user-1',
            title: 'Gardening',
            description: 'Weed garden and trim hedges',
            category_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
            postcode: 'SW1A 1AA',
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2099-12-31',
            status: 'open',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            category: { name: 'Gardening' },
            employer: { first_name: 'Alice', last_name: 'Smith' },
          },
        },
        applications: { count: 2 },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { getJob } = useJobs();
    const result = await getJob(jobId);

    expect(result.job.id).toBe(jobId);
    expect(result.job.title).toBe('Gardening');
    expect(result.job.application_count).toBe(2);
  });

  it('updates a job end-to-end', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const mockClient = createSupabaseMock({
      from: {
        jobs: {
          single: {
            id: jobId,
            employer_id: 'user-1',
            status: 'open',
            title: 'Updated Gardening',
            description: 'Weed garden and trim hedges',
            category_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
            postcode: 'SW1A 1AA',
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2099-12-31',
            created_at: '2024-01-01',
            updated_at: '2024-01-02',
            category: { name: 'Gardening' },
            employer: { first_name: 'Alice', last_name: 'Smith' },
          },
        },
        applications: { select: [] },
        contracts: { select: [] },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { updateJob } = useJobs();
    const result = await updateJob(jobId, { title: 'Updated Gardening' });

    expect(result.job.id).toBe(jobId);
    expect(result.job.title).toBe('Updated Gardening');
  });

  it('deletes a job end-to-end', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const mockClient = createSupabaseMock({
      from: {
        jobs: {
          single: { employer_id: 'user-1' },
        },
        contracts: { select: [] },
        applications: { select: [] },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useJobs } = await import('~/composables/useJobs');
    const { deleteJob } = useJobs();
    const result = await deleteJob(jobId);

    expect(result.success).toBe(true);
  });
});
