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

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: mockServerSupabaseClient,
  serverSupabaseUser: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/rateLimit', () => ({
  rateLimiters: {
    general: vi.fn(() => Promise.resolve({})),
  },
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('GET /api/reviews/user/:id', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: imported } = await import('~/server/api/reviews/user/[id].get');
    handler = imported;
  });

  it('returns reviews grouped by role with average ratings', async () => {
    const userId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const employerId = 'employer-1';
    const workerId = userId;
    const jobId1 = 'job-1';
    const jobId2 = 'job-2';

    const reviews = [
      {
        id: 'rev-1',
        job_id: jobId1,
        reviewer_id: 'reviewer-1',
        reviewed_user_id: employerId,
        rating: 5,
        comment: 'Great employer',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        job: { id: jobId1, title: 'Gardening' },
        reviewer: { username: 'alice', first_name: 'Alice', last_name: 'Smith' },
      },
      {
        id: 'rev-2',
        job_id: jobId2,
        reviewer_id: 'reviewer-2',
        reviewed_user_id: workerId,
        rating: 4,
        comment: 'Good worker',
        created_at: '2024-02-01',
        updated_at: '2024-02-01',
        job: { id: jobId2, title: 'Cleaning' },
        reviewer: { username: 'bob', first_name: 'Bob', last_name: 'Jones' },
      },
    ];

    const mockClient = createSupabaseMock({
      from: {
        reviews: { select: reviews },
        jobs: { select: [
          { id: jobId1, employer_id: employerId },
          { id: jobId2, employer_id: employerId },
        ]},
        contracts: { select: [
          { job_id: jobId1, worker_id: workerId, employer_id: employerId },
          { job_id: jobId2, worker_id: workerId, employer_id: employerId },
        ]},
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: userId } } }));

    expect(result.user_id).toBe(userId);
    expect(result.reviews.as_employer).toHaveLength(1);
    expect(result.reviews.as_worker).toHaveLength(1);
    expect(result.reviews.all).toHaveLength(2);
    expect(result.average_ratings.as_employer).toBe(5);
    expect(result.average_ratings.as_worker).toBe(4);
    expect(result.average_ratings.overall).toBe(4.5);
  });

  it('returns empty arrays and null averages when no reviews exist', async () => {
    const userId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';

    const mockClient = createSupabaseMock({
      from: {
        reviews: { select: [] },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: userId } } }));

    expect(result.user_id).toBe(userId);
    expect(result.reviews.as_worker).toEqual([]);
    expect(result.reviews.as_employer).toEqual([]);
    expect(result.reviews.all).toEqual([]);
    expect(result.average_ratings.as_worker).toBeNull();
    expect(result.average_ratings.as_employer).toBeNull();
    expect(result.average_ratings.overall).toBeNull();
  });

  it('throws 400 when user ID is missing', async () => {
    try {
      await handler(createEvent({ context: { params: {} } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('User ID is required');
    }
  });

  it('throws 400 for invalid user ID format', async () => {
    try {
      await handler(createEvent({ context: { params: { id: 'not-a-uuid' } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Invalid user ID format');
    }
  });
});
