import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
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
  context: { user: { id: 'user-1' } },
  query: {},
  ...overrides,
});

describe('Reviews Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', email: 'test@example.com' });
  });

  describe('POST /api/reviews', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/reviews/index.post');
      handler = imported;
    });

    it('creates a review as employer successfully', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const payload = {
        job_id: jobId,
        reviewed_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        rating: 5,
        comment: 'Great worker, highly recommended!',
      };

      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899' } },
          applications: { maybeSingle: { worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898', status: 'completed' } },
          reviews: { insertSingle: { review_id: 'rev-1', job_id: jobId, reviewer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', reviewed_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898', rating: 5, comment: 'Great worker, highly recommended!!', created_at: '2024-01-01', updated_at: '2024-01-01' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'POST', body: payload }));
      expect(result.review.rating).toBe(5);
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ method: 'POST', body: {} }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 403 when user is not a participant', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const payload = {
        job_id: jobId,
        reviewed_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        rating: 4,
        comment: 'Good job indeed!',
      };

      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'other-user' } },
          applications: { maybeSingle: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: payload }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
        expect(error.statusMessage).toBe('You can only review jobs you participated in');
      }
    });

    it('throws 409 when review already exists', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const payload = {
        job_id: jobId,
        reviewed_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        rating: 4,
        comment: 'Duplicate review attempt!',
      };

      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899' } },
          applications: { maybeSingle: { worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898', status: 'completed' } },
          reviews: { maybeSingle: { review_id: 'existing-rev' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: payload }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(409);
        expect(error.statusMessage).toBe('You have already reviewed this user for this job');
      }
    });
  });
});
