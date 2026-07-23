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

vi.mock('~/server/utils/rateLimit', () => ({
  rateLimiters: {
    general: vi.fn(() => Promise.resolve({})),
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
  method: 'POST',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Payout Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@example.com' });
  });

  describe('POST /api/payments/payout', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/payments/payout.post');
      handler = imported;
    });

    it('processes payout for completed contract with idempotency key', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          contracts: { single: { id: contractId, employer_id: 'employer-1', worker_id: 'worker-1', job_id: jobId, payout_amount: 100, payout_status: 'pending', status: 'completed' } },
          payment_transactions: {
            maybeSingle: null,
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { contract_id: contractId, idempotency_key: 'key-123' },
      }));

      expect(result.success).toBe(true);
      expect(result.payout_amount).toBe(100);
      expect(result.status).toBe('processed');
    });

    it('returns existing processed payout for duplicate idempotency key', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          contracts: { single: { id: contractId, employer_id: 'employer-1', worker_id: 'worker-1', job_id: jobId, payout_amount: 100, payout_status: 'pending', status: 'completed' } },
          payment_transactions: {
            maybeSingle: { status: 'processed', amount: 100, occurred_at: '2024-01-01' },
          },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { contract_id: contractId, idempotency_key: 'key-123' },
      }));

      expect(result.success).toBe(true);
      expect(result.status).toBe('processed');
    });

    it('rejects payout for non-completed contract', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: 'employer-1' } },
          contracts: { single: { id: contractId, employer_id: 'employer-1', worker_id: 'worker-1', job_id: jobId, payout_amount: 100, payout_status: 'pending', status: 'active' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          body: { contract_id: contractId },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toContain('Only completed contracts');
      }
    });

    it('throws 404 when contract not found', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const mockClient = createSupabaseMock({
        from: {
          contracts: { single: null, error: { message: 'not found' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({
          body: { contract_id: contractId },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toBe('Contract not found');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({
          body: { contract_id: 'any-id' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ body: {} }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Validation failed');
      }
    });
  });
});
