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
  method: 'PATCH',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
const workerId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898';

const baseApplication = {
  id: appId,
  status: 'pending',
  job_id: jobId,
  worker_id: workerId,
  version: 1,
  cover_letter: 'I am qualified for this job',
  proposed_rate: 25,
  withdrawal_reason: null,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const acceptedApplication = { ...baseApplication, status: 'accepted' };
const rejectedApplication = { ...baseApplication, status: 'rejected' };
const withdrawnApplication = { ...baseApplication, status: 'withdrawn' };

const baseJob = {
  id: jobId,
  title: 'Gardening',
  employer_id: 'user-1',
  status: 'open',
  deadline: '2025-12-31',
  budget_type: 'fixed',
  budget_amount: 100,
};

const paymentEvent = {
  payment_intent_id: 'pi_test_123',
  amount: 115,
  metadata: { platform_fee: 15, payout_amount: 100 },
};

const acceptedContract = {
  id: 'contract-1',
  payout_amount: 100,
  employer_id: 'user-1',
  worker_id: workerId,
  job_id: jobId,
};

describe('Applications Patch Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('PATCH /api/applications/:id', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/applications/[id].patch');
      handler = imported;
    });

    it('accepts an application as employer', async () => {
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: baseJob },
          applications: {
            single: acceptedApplication,
            maybeSingle: null,
          },
          payment_transactions: { maybeSingle: paymentEvent },
          contracts: { maybeSingle: acceptedContract },
          application_status_history: {},
        },
        rpc: { accept_application: null },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        context: { params: { id: appId } },
        body: { status: 'accepted' },
      }));
      expect(result.application.status).toBe('accepted');
    });

    it('rejects an application as employer', async () => {
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: baseJob },
          applications: { single: rejectedApplication },
          payment_transactions: { maybeSingle: null },
          application_status_history: {},
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        context: { params: { id: appId } },
        body: { status: 'rejected' },
      }));
      expect(result.application.status).toBe('rejected');
    });

    it('withdraws an application as worker', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: workerId });
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: baseJob },
          applications: { single: withdrawnApplication },
          payment_transactions: { maybeSingle: null },
          application_status_history: {},
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        context: { params: { id: appId } },
        body: { status: 'withdrawn' },
      }));
      expect(result.application.status).toBe('withdrawn');
    });

    it('throws 403 for unauthorized user', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'hacker-1' });
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: baseJob },
          applications: { single: baseApplication },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          context: { params: { id: appId } },
          body: { status: 'accepted' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });

    it('throws 400 on invalid status transition', async () => {
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: baseJob },
          applications: { single: { ...baseApplication, status: 'accepted' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          context: { params: { id: appId } },
          body: { status: 'rejected' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain('Cannot change application status');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({
          context: { params: { id: appId } },
          body: { status: 'accepted' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({
          context: { params: { id: appId } },
          body: { status: 'invalid-status' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Validation failed');
      }
    });
  });
});
