import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getRouterParam } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
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

describe('Applications Job Stats Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/applications/job/:id', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/applications/job/[id].get');
      handler = imported;
    });

    it('returns applications for job employer', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const applications = [
        {
          id: 'app-1',
          job_id: jobId,
          worker_id: 'worker-1',
          status: 'pending',
          cover_letter: 'I am qualified',
          proposed_rate: 25,
          withdrawal_reason: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          worker: { username: 'alice', first_name: 'Alice', last_name: 'Smith', bio: 'Gardener' },
          job: { budget_amount: 100, budget_type: 'fixed' },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'user-1' } },
          applications: { select: applications },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ context: { params: { id: jobId } } }));
      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].worker_name).toBe('Alice Smith');
    });

    it('throws 400 when job ID is missing', async () => {
      try {
        await handler(createEvent({ context: { params: { id: '' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Job ID is required');
      }
    });

    it('throws 403 when user is not the employer', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'other-user' } },
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

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ context: { params: { id: 'any-id' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
