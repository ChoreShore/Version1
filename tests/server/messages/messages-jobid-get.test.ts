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

describe('Messages JobId GET Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/messages/:jobId', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/messages/[jobId].get');
      handler = imported;
    });

    it('returns messages for job participant', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const messages = [
        {
          id: 'msg-1',
          job_id: jobId,
          application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          body: 'Hello there',
          created_at: '2024-01-01',
          sender: { username: 'alice', id: 'user-1', first_name: 'Alice', last_name: 'Smith', bio: null },
          receiver: { username: 'bob', id: 'user-2', first_name: 'Bob', last_name: 'Jones', bio: null },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { id: jobId, employer_id: 'user-1' } },
          messages: { select: messages },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ context: { params: { id: jobId } } }));
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].body).toBe('Hello there');
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(50);
    });

    it('throws 400 for invalid job ID format', async () => {
      try {
        await handler(createEvent({ context: { params: { id: 'not-a-uuid' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Invalid Job ID format');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';

      try {
        await handler(createEvent({ context: { params: { id: jobId } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
