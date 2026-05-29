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

describe('Applications GET Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/applications', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/applications/index.get');
      handler = imported;
    });

    it('returns applications for authenticated employer', async () => {
      const applications = [
        {
          id: 'app-1',
          job_id: 'job-1',
          worker_id: 'worker-1',
          status: 'pending',
          cover_letter: 'I want this job',
          proposed_rate: 25,
          withdrawal_reason: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          job: { title: 'Gardening', employer_id: 'user-1', budget_amount: 100, budget_type: 'fixed' },
          worker: { username: 'alice', first_name: 'Alice', last_name: 'Smith', bio: 'Experienced gardener' },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['employer'] } },
          applications: { select: applications },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].job_title).toBe('Gardening');
      expect(result.applications[0].worker_name).toBe('Alice Smith');
    });

    it('returns applications for authenticated worker', async () => {
      const applications = [
        {
          id: 'app-2',
          job_id: 'job-2',
          worker_id: 'user-1',
          status: 'pending',
          cover_letter: 'I am qualified',
          proposed_rate: 30,
          withdrawal_reason: null,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
          job: { title: 'Cleaning', employer_id: 'employer-2', budget_amount: 80, budget_type: 'fixed', employer: { first_name: 'Bob', last_name: 'Jones' } },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { id: 'user-1', roles: ['worker'] } },
          applications: { select: applications },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent());
      expect(result.applications).toHaveLength(1);
      expect(result.applications[0].job_title).toBe('Cleaning');
      expect(result.applications[0].employer_name).toBe('Bob Jones');
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
  });
});
