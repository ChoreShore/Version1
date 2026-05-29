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

describe('Payments Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@example.com' });
  });

  describe('POST /api/payments/create-intent', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/payments/create-intent.post');
      handler = imported;
    });

    it('creates a payment intent for valid application', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: {
              id: applicationId,
              status: 'accepted',
              worker_id: 'worker-1',
              job: { id: jobId, employer_id: 'employer-1', budget_type: 'fixed', budget_amount: 100, title: 'Gardening' }
            }
          },
          payment_methods: {
            maybeSingle: { id: 'pm-1', user_id: 'employer-1', role: 'employer', method_type: 'card', connection_status: 'connected', verification_status: 'verified' }
          },
          payment_transactions: {
            maybeSingle: null
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { application_id: applicationId, idempotency_key: 'key-123' }
      }));

      expect(result.success).toBe(true);
      expect(result.amount).toBe(115); // 100 + 15% platform fee
      expect(result.platform_fee).toBe(15);
      expect(result.payout_amount).toBe(100);
      expect(result.status).toBe('pending');
    });

    it('returns existing intent when idempotency key matches', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: {
              id: applicationId,
              status: 'accepted',
              worker_id: 'worker-1',
              job: { id: jobId, employer_id: 'employer-1', budget_type: 'fixed', budget_amount: 100, title: 'Gardening' }
            }
          },
          payment_methods: {
            maybeSingle: { id: 'pm-1', user_id: 'employer-1', role: 'employer', method_type: 'card', connection_status: 'connected', verification_status: 'verified' }
          },
          payment_transactions: {
            maybeSingle: {
              payment_intent_id: 'pi_existing',
              amount: 115,
              status: 'pending',
              occurred_at: '2024-01-01',
              metadata: { platform_fee: 15, payout_amount: 100 }
            }
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { application_id: applicationId, idempotency_key: 'key-123' }
      }));

      expect(result.success).toBe(true);
      expect(result.payment_intent_id).toBe('pi_existing');
    });

    it('rejects when no connected payment method', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: {
              id: applicationId,
              status: 'accepted',
              worker_id: 'worker-1',
              job: { id: jobId, employer_id: 'employer-1', budget_type: 'fixed', budget_amount: 100, title: 'Gardening' }
            }
          },
          payment_methods: { maybeSingle: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          body: { application_id: applicationId, idempotency_key: 'key-123' }
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain('Connect and verify a payment card');
      }
    });

    it('rejects when job is not fixed-price', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: {
              id: applicationId,
              status: 'accepted',
              worker_id: 'worker-1',
              job: { id: jobId, employer_id: 'employer-1', budget_type: 'hourly', budget_amount: 25, title: 'Gardening' }
            }
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          body: { application_id: applicationId, idempotency_key: 'key-123' }
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Payment intents are only required for fixed-price jobs');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({
          body: { application_id: 'any-id', idempotency_key: 'key-123' }
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/payments/confirm', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/payments/confirm.post');
      handler = imported;
    });

    it('confirms payment for existing pending event', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const paymentIntentId = 'pi_test_123';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: { id: applicationId, job_id: jobId, worker_id: 'worker-1', job: { id: jobId, title: 'Gardening' } }
          },
          payment_transactions: {
            maybeSingle: { id: 'evt-1', status: 'pending' }
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { application_id: applicationId, payment_intent_id: paymentIntentId }
      }));

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
      expect(result.payment_intent_id).toBe(paymentIntentId);
    });

    it('returns already processed when event is already processed', async () => {
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const paymentIntentId = 'pi_test_123';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: {
            single: { id: applicationId, job_id: jobId }
          },
          payment_transactions: {
            maybeSingle: { id: 'evt-1', status: 'processed' }
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { application_id: applicationId, payment_intent_id: paymentIntentId }
      }));

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
    });

    it('throws 404 when application not found', async () => {
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          applications: { single: null, error: { message: 'not found' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          body: { application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', payment_intent_id: 'pi_test' }
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toBe('Application not found');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({
          body: { application_id: 'any-id', payment_intent_id: 'pi_test' }
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
