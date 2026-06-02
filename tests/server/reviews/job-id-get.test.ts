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

describe('GET /api/reviews/job/:id', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
    const { default: imported } = await import('~/server/api/reviews/job/[id].get');
    handler = imported;
  });

  it('returns review for a valid job ID', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const review = {
      id: 'rev-1',
      job_id: jobId,
      reviewer_id: 'reviewer-1',
      reviewed_user_id: 'worker-1',
      rating: 4,
      comment: 'Good job',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      job: { id: jobId, title: 'Cleaning' },
      reviewer: { username: 'alice', id: 'reviewer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
      reviewed_user: { username: 'bob', id: 'worker-1', first_name: 'Bob', last_name: 'Jones', bio: null },
    };

    const mockClient = createSupabaseMock({
      from: { reviews: { maybeSingle: review } },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: jobId } } }));
    expect(result.review.rating).toBe(4);
    expect(result.review.job_title).toBe('Cleaning');
  });

  it('throws 404 when review not found', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';

    const mockClient = createSupabaseMock({
      from: { reviews: { maybeSingle: null } },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    try {
      await handler(createEvent({ context: { params: { id: jobId } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(404);
      expect(error.statusMessage).toBe('Review not found');
    }
  });

  it('throws 400 when job ID is missing', async () => {
    try {
      await handler(createEvent({ context: { params: {} } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Job ID is required');
    }
  });

  it('throws 400 for invalid job ID format', async () => {
    try {
      await handler(createEvent({ context: { params: { id: 'not-a-uuid' } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Invalid job ID format');
    }
  });

  it('throws 401 when not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null);

    try {
      await handler(createEvent({ context: { params: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890' } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
    }
  });
});
