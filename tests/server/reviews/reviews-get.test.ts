import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

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

describe('Reviews GET Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/reviews', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/reviews/index.get');
      handler = imported;
    });

    it('returns reviews received by user', async () => {
      const reviews = [
        {
          id: 'rev-1',
          job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
          reviewer_id: 'reviewer-1',
          reviewed_user_id: 'user-1',
          rating: 5,
          comment: 'Great worker!',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          job: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890', title: 'Gardening' },
          reviewer: { username: 'alice', id: 'reviewer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
          reviewed_user: { username: 'bob', id: 'user-1', first_name: 'Bob', last_name: 'Jones', bio: null },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          reviews: { select: reviews },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].rating).toBe(5);
      expect(result.reviews[0].reviewer_first_name).toBe('Alice');
    });

    it('returns reviews given by user', async () => {
      const reviews = [
        {
          id: 'rev-2',
          job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
          reviewer_id: 'user-1',
          reviewed_user_id: 'reviewed-1',
          rating: 4,
          comment: 'Good employer',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
          job: { id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890', title: 'Cleaning' },
          reviewer: { username: 'alice', id: 'user-1', first_name: 'Alice', last_name: 'Smith', bio: null },
          reviewed_user: { username: 'bob', id: 'reviewed-1', first_name: 'Bob', last_name: 'Jones', bio: null },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          reviews: { select: reviews },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ query: { type: 'given' } }));
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].rating).toBe(4);
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('throws 400 on database error', async () => {
      const mockClient = createSupabaseMock({
        from: {
          reviews: { select: [], error: { message: 'Connection timeout' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Connection timeout');
      }
    });

    it('defaults to received type when no query param provided', async () => {
      const reviews = [
        {
          id: 'rev-1',
          job_id: 'job-1',
          reviewer_id: 'reviewer-1',
          reviewed_user_id: 'user-1',
          rating: 3,
          comment: 'Average',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          job: { id: 'job-1', title: 'Gardening' },
          reviewer: { username: 'alice', id: 'reviewer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
          reviewed_user: { username: 'bob', id: 'user-1', first_name: 'Bob', last_name: 'Jones', bio: null },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          reviews: { select: reviews },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].reviewer_first_name).toBe('Alice');
    });

    it('returns empty reviews array when none exist', async () => {
      const mockClient = createSupabaseMock({
        from: {
          reviews: { select: [] },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.reviews).toEqual([]);
    });
  });
});
