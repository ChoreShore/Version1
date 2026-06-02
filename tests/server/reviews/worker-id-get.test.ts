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

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('GET /api/reviews/worker/:id', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: imported } = await import('~/server/api/reviews/worker/[id].get');
    handler = imported;
  });

  it('returns reviews for a valid worker ID', async () => {
    const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const reviews = [
      {
        id: 'rev-1',
        job_id: 'job-1',
        reviewer_id: 'reviewer-1',
        reviewed_user_id: workerId,
        rating: 5,
        comment: 'Excellent work',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        job: { id: 'job-1', title: 'Gardening' },
        reviewer: { username: 'alice', id: 'reviewer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
        reviewed_user: { username: 'bob', id: workerId, first_name: 'Bob', last_name: 'Jones', bio: null },
      },
    ];

    const mockClient = createSupabaseMock({
      from: { reviews: { select: reviews } },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: workerId } } }));
    expect(result.reviews).toHaveLength(1);
    expect(result.reviews[0].rating).toBe(5);
    expect(result.reviews[0].job_title).toBe('Gardening');
  });

  it('returns empty reviews array when none exist', async () => {
    const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';

    const mockClient = createSupabaseMock({
      from: { reviews: { select: [] } },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: workerId } } }));
    expect(result.reviews).toEqual([]);
  });

  it('throws 400 when worker ID is missing', async () => {
    try {
      await handler(createEvent({ context: { params: {} } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Worker ID is required');
    }
  });

  it('throws 400 for invalid worker ID format', async () => {
    try {
      await handler(createEvent({ context: { params: { id: 'not-a-uuid' } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Invalid worker ID format');
    }
  });
});
