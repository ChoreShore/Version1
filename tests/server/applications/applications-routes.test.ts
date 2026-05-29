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

vi.mock('~/server/utils/csrf', () => ({
  requireCsrfProtection: vi.fn(),
  validateOrigin: vi.fn(),
}));

vi.mock('~/server/utils/rateLimit', () => ({
  rateLimiters: {
    applications: vi.fn(() => Promise.resolve({})),
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

vi.mock('~/server/utils/email', () => ({
  sendNotificationEmail: vi.fn(() => Promise.resolve({})),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Applications Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1', email: 'worker@example.com' });
  });

  describe('POST /api/applications', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/applications/index.post');
      handler = imported;
    });

    const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    it('creates an application with valid data', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const application = {
        id: 'app-1',
        job_id: jobId,
        worker_id: 'worker-1',
        cover_letter: 'I am very qualified',
        proposed_rate: 25,
        status: 'pending',
        withdrawal_reason: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { id: jobId, title: 'Gardening', status: 'open', employer_id: 'employer-1', deadline: futureDeadline } },
          profiles: { single: { id: 'worker-1', roles: ['worker'], first_name: 'Alice', last_name: 'Smith' } },
          applications: { insertSingle: application },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ body: { job_id: jobId, cover_letter: 'I am very qualified', proposed_rate: 25 } }));
      expect(result.application.id).toBe('app-1');
      expect(result.application.status).toBe('pending');
    });

    it('rejects when job is not open', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { id: jobId, title: 'Gardening', status: 'closed', employer_id: 'employer-1', deadline: futureDeadline } },
          profiles: { single: { id: 'worker-1', roles: ['worker'], first_name: 'Alice', last_name: 'Smith' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ body: { job_id: jobId, cover_letter: 'I am very qualified', proposed_rate: 25 } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain("not 'open'");
      }
    });

    it('rejects when user applies to their own job', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1' });
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { id: jobId, title: 'Gardening', status: 'open', employer_id: 'employer-1', deadline: futureDeadline } },
          profiles: { single: { id: 'employer-1', roles: ['employer', 'worker'], first_name: 'Bob', last_name: 'Jones' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ body: { job_id: jobId, cover_letter: 'I am very qualified', proposed_rate: 25 } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain('own job');
      }
    });

    it('rejects when user does not have worker role', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { id: jobId, title: 'Gardening', status: 'open', employer_id: 'employer-1', deadline: futureDeadline } },
          profiles: { single: { id: 'worker-1', roles: ['employer'], first_name: 'Alice', last_name: 'Smith' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ body: { job_id: jobId, cover_letter: 'I am very qualified', proposed_rate: 25 } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain("Need 'worker' role");
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ body: { job_id: 'any-id', cover_letter: 'test', proposed_rate: 25 } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ body: { job_id: 'not-a-uuid' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Validation failed');
      }
    });
  });
});
