import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery } from 'h3';
import { createSupabaseMock } from '../mocks/createSupabaseMock';
import { createIntegrationFetch } from '../helpers/integration';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
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

describe('Reviews Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@test.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('creates a review end-to-end as employer', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898';
    const reviewId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { employer_id: 'employer-1' } },
        applications: { maybeSingle: { worker_id: workerId, status: 'completed' } },
        reviews: {
          maybeSingle: null,
          insertSingle: {
            id: reviewId,
            job_id: jobId,
            reviewer_id: 'employer-1',
            reviewed_user_id: workerId,
            rating: 5,
            comment: 'Great worker, highly recommended!',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { createReview } = useReviews();
    const result = await createReview({
      job_id: jobId,
      reviewed_user_id: workerId,
      rating: 5,
      comment: 'Great worker, highly recommended!',
    });

    expect(result.review.rating).toBe(5);
    expect(result.review.review_id).toBe(reviewId);
  });

  it('lists received reviews end-to-end', async () => {
    const reviews = [
      {
        id: 'rev-1',
        job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        reviewer_id: 'reviewer-1',
        reviewed_user_id: 'employer-1',
        rating: 5,
        comment: 'Great employer!',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        job: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890', title: 'Gardening' },
        reviewer: { username: 'alice', id: 'reviewer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
        reviewed_user: { username: 'bob', id: 'employer-1', first_name: 'Bob', last_name: 'Jones', bio: null },
      },
    ];

    const mockClient = createSupabaseMock({
      from: {
        reviews: { select: reviews },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { listReviews } = useReviews();
    const result = await listReviews('received');

    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].rating).toBe(5);
    expect(result.reviews[0].reviewer_first_name).toBe('Alice');
  });

  it('lists given reviews end-to-end', async () => {
    const reviews = [
      {
        id: 'rev-2',
        job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        reviewer_id: 'employer-1',
        reviewed_user_id: 'worker-1',
        rating: 4,
        comment: 'Good worker',
        created_at: '2024-01-02',
        updated_at: '2024-01-02',
        job: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890', title: 'Cleaning' },
        reviewer: { username: 'alice', id: 'employer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
        reviewed_user: { username: 'bob', id: 'worker-1', first_name: 'Bob', last_name: 'Jones', bio: null },
      },
    ];

    const mockClient = createSupabaseMock({
      from: {
        reviews: { select: reviews },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { listReviews } = useReviews();
    const result = await listReviews('given');

    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].rating).toBe(4);
    expect(result.reviews[0].reviewed_user_first_name).toBe('Bob');
  });

  it('returns validation error for invalid review payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { employer_id: 'employer-1' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { createReview } = useReviews();

    await expect(createReview({
      job_id: 'invalid-uuid',
      reviewed_user_id: 'also-invalid',
      rating: 10,
      comment: '',
    } as any)).rejects.toThrow();
  });

  it('rejects review creation when user is not a participant', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { employer_id: 'other-user' } },
        applications: { maybeSingle: null },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { createReview } = useReviews();

    await expect(createReview({
      job_id: jobId,
      reviewed_user_id: workerId,
      rating: 4,
      comment: 'Good job indeed!',
    })).rejects.toThrow('You can only review jobs you participated in');
  });

  it('rejects duplicate review creation', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { employer_id: 'employer-1' } },
        applications: { maybeSingle: { worker_id: workerId, status: 'completed' } },
        reviews: { maybeSingle: { review_id: 'existing-rev' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useReviews } = await import('~/composables/useReviews');
    const { createReview } = useReviews();

    await expect(createReview({
      job_id: jobId,
      reviewed_user_id: workerId,
      rating: 4,
      comment: 'Duplicate review attempt!',
    })).rejects.toThrow('You have already reviewed this user for this job');
  });
});
