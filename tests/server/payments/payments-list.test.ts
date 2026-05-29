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

describe('Payments List Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/payments', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/payments/index.get');
      handler = imported;
    });

    it('returns payment events for employer', async () => {
      const transactions = [
        {
          id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
          application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
          contract_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892',
          job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893',
          employer_id: 'user-1',
          worker_id: 'worker-1',
          actor_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567894',
          actor_role: 'employer',
          event_type: 'employer_payment',
          status: 'processed',
          amount: 115,
          currency: 'GBP',
          payment_intent_id: 'pi_test',
          occurred_at: '2024-01-01',
          metadata: {},
          job: { title: 'Gardening' },
          employer: { first_name: 'Alice', last_name: 'Smith' },
          worker: { username: 'bob', first_name: 'Bob', last_name: 'Jones', bio: 'Gardener' },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          payment_transactions: { select: transactions },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ query: {} }));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].event_type).toBe('employer_payment');
      expect(result.events[0].job_title).toBe('Gardening');
      expect(result.events[0].counterparty_name).toBe('Bob Jones');
    });

    it('returns payment events for worker', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1' });
      const transactions = [
        {
          id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
          application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
          contract_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892',
          job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893',
          employer_id: 'employer-1',
          worker_id: 'worker-1',
          actor_user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567894',
          actor_role: 'employer',
          event_type: 'worker_payout',
          status: 'processed',
          amount: 100,
          currency: 'GBP',
          payment_intent_id: 'pi_test',
          occurred_at: '2024-01-01',
          metadata: {},
          job: { title: 'Gardening' },
          employer: { first_name: 'Alice', last_name: 'Smith' },
          worker: { username: 'bob', first_name: 'Bob', last_name: 'Jones', bio: 'Gardener' },
        },
      ];
      const mockClient = createSupabaseMock({
        from: {
          payment_transactions: { select: transactions },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ query: { role: 'worker' } }));
      expect(result.events).toHaveLength(1);
      expect(result.events[0].counterparty_name).toBe('Alice Smith');
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
