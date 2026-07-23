import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam } from 'h3';
import { createSupabaseMock } from '../mocks/createSupabaseMock';
import { createIntegrationFetch } from '../helpers/integration';

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

vi.mock('~/server/utils/csrf', () => ({
  requireCsrfProtection: vi.fn(),
  validateOrigin: vi.fn(),
}));

vi.mock('~/server/utils/rateLimit', () => ({
  rateLimiters: {
    general: vi.fn(() => Promise.resolve({})),
    auth: vi.fn(() => Promise.resolve({})),
    messages: vi.fn(() => Promise.resolve({})),
    jobCreation: vi.fn(() => Promise.resolve({})),
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
  getUserDetails: vi.fn(() => Promise.resolve({ firstName: 'Alice', lastName: 'Smith' })),
}));

describe('Payments Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@test.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('connects a payment method end-to-end', async () => {
    const methodId = 'a1b2c3d4-e5f6-4aaa-8bcd-ef1234567890';
    const employerId = 'b1c2d3e4-f5a6-4bbb-9cde-ef1234567891';
    mockServerSupabaseUser.mockResolvedValue({ id: employerId, email: 'employer@test.com' });

    const mockClient = createSupabaseMock({
      from: {
        payment_methods: {
          insertSingle: {
            id: methodId,
            user_id: employerId,
            role: 'employer',
            method_type: 'card',
            provider: 'stripe_mock',
            connection_status: 'connected',
            verification_status: 'pending',
            brand: 'Visa',
            last4: '4242',
            display_label: 'My Visa',
            connected_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    // usePayments doesn't export connect — invoke handler directly via $fetch bridge
    const result = await (globalThis as any).$fetch('/api/payments/methods/connect', {
      method: 'POST',
      body: {
        role: 'employer',
        method_type: 'card',
        brand: 'Visa',
        last4: '4242',
        display_label: 'My Visa',
      },
    });

    expect(result.success).toBe(true);
    expect(result.method.id).toBe(methodId);
    expect(result.method.connection_status).toBe('connected');
    expect(result.method.verification_status).toBe('pending');
  });

  it('creates a payment intent end-to-end', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    const mockClient = createSupabaseMock({
      from: {
        applications: {
          single: {
            id: appId,
            status: 'pending',
            worker_id: 'worker-1',
            job: { id: jobId, employer_id: 'employer-1', budget_type: 'fixed', budget_amount: 100, title: 'Gardening' },
          },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_methods: {
          maybeSingle: {
            id: 'pm-1',
            user_id: 'employer-1',
            role: 'employer',
            method_type: 'card',
            connection_status: 'connected',
            verification_status: 'verified',
          },
        },
        payment_transactions: {
          maybeSingle: null,
          insertSingle: {
            id: 'pt-1',
            application_id: appId,
            job_id: jobId,
            event_type: 'employer_payment',
            status: 'pending',
            amount: 115,
            currency: 'GBP',
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { createIntent } = usePayments();
    const result = await createIntent({
      application_id: appId,
      idempotency_key: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.amount).toBe(115);
    expect(result.platform_fee).toBe(15);
    expect(result.payout_amount).toBe(100);
    expect(result.status).toBe('pending');
    expect(result.payment_intent_id).toBeDefined();
    expect(result.client_secret).toBeDefined();
  });

  it('confirms a payment intent end-to-end', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const paymentIntentId = 'pi_mock_123';

    const mockClient = createSupabaseMock({
      from: {
        applications: {
          single: { id: appId, job_id: jobId },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_transactions: {
          single: {
            id: 'pt-1',
            application_id: appId,
            payment_intent_id: paymentIntentId,
            status: 'pending',
            event_type: 'employer_payment',
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { confirmPayment } = usePayments();
    const result = await confirmPayment({
      application_id: appId,
      payment_intent_id: paymentIntentId,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('processed');
    expect(result.payment_intent_id).toBe(paymentIntentId);
  });

  it('processes a payout end-to-end', async () => {
    const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    const mockClient = createSupabaseMock({
      from: {
        contracts: {
          single: {
            id: contractId,
            employer_id: 'employer-1',
            worker_id: 'worker-1',
            job_id: jobId,
            payout_amount: 100,
            payout_status: 'pending',
            status: 'completed',
          },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_transactions: {
          maybeSingle: null,
          single: {
            id: 'pt-2',
            contract_id: contractId,
            event_type: 'worker_payout',
            status: 'pending',
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { processPayout } = usePayments();
    const result = await processPayout({
      contract_id: contractId,
      idempotency_key: 'payout-key-1',
    });

    expect(result.success).toBe(true);
    expect(result.payout_amount).toBe(100);
    expect(result.status).toBe('processed');
  });

  it('returns idempotent create-intent when called twice with same key', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const existingIntentId = 'pi_mock_existing';

    const mockClient = createSupabaseMock({
      from: {
        applications: {
          single: {
            id: appId,
            status: 'pending',
            worker_id: 'worker-1',
            job: { id: jobId, employer_id: 'employer-1', budget_type: 'fixed', budget_amount: 200, title: 'Painting' },
          },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_methods: {
          maybeSingle: {
            id: 'pm-1',
            user_id: 'employer-1',
            role: 'employer',
            method_type: 'card',
            connection_status: 'connected',
            verification_status: 'verified',
          },
        },
        payment_transactions: {
          maybeSingle: {
            payment_intent_id: existingIntentId,
            amount: 230,
            status: 'pending',
            occurred_at: '2024-01-01T00:00:00Z',
            metadata: { platform_fee: 30, payout_amount: 200, job_title: 'Painting' },
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { createIntent } = usePayments();
    const result = await createIntent({
      application_id: appId,
      idempotency_key: 'same-key',
    });

    expect(result.success).toBe(true);
    expect(result.payment_intent_id).toBe(existingIntentId);
    expect(result.amount).toBe(230);
    expect(result.platform_fee).toBe(30);
    expect(result.payout_amount).toBe(200);
  });

  it('returns idempotent confirm when payment already processed', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const paymentIntentId = 'pi_mock_456';

    const mockClient = createSupabaseMock({
      from: {
        applications: {
          single: { id: appId, job_id: jobId },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_transactions: {
          single: {
            id: 'pt-1',
            application_id: appId,
            payment_intent_id: paymentIntentId,
            status: 'processed',
            event_type: 'employer_payment',
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { confirmPayment } = usePayments();
    const result = await confirmPayment({
      application_id: appId,
      payment_intent_id: paymentIntentId,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('processed');
    expect(result.payment_intent_id).toBe(paymentIntentId);
  });

  it('returns idempotent payout when already processed with same key', async () => {
    const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    const mockClient = createSupabaseMock({
      from: {
        contracts: {
          single: {
            id: contractId,
            employer_id: 'employer-1',
            worker_id: 'worker-1',
            job_id: jobId,
            payout_amount: 150,
            payout_status: 'pending',
            status: 'completed',
          },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1' } },
        payment_transactions: {
          maybeSingle: {
            status: 'processed',
            amount: 150,
            occurred_at: '2024-01-02T00:00:00Z',
          },
          single: null,
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { processPayout } = usePayments();
    const result = await processPayout({
      contract_id: contractId,
      idempotency_key: 'repeat-payout-key',
    });

    expect(result.success).toBe(true);
    expect(result.payout_amount).toBe(150);
    expect(result.status).toBe('processed');
    expect(result.occurred_at).toBe('2024-01-02T00:00:00Z');
  });

  it('returns validation error for invalid create-intent payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'employer-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { createIntent } = usePayments();

    await expect(
      createIntent({ application_id: 'not-a-uuid', idempotency_key: '' } as any)
    ).rejects.toThrow();
  });

  it('returns validation error for invalid confirm payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'employer-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { confirmPayment } = usePayments();

    await expect(
      confirmPayment({ application_id: 'not-a-uuid', payment_intent_id: '' } as any)
    ).rejects.toThrow();
  });

  it('returns validation error for invalid payout payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'employer-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { usePayments } = await import('~/composables/usePayments');
    const { processPayout } = usePayments();

    await expect(
      processPayout({ contract_id: 'not-a-uuid' } as any)
    ).rejects.toThrow();
  });

  it('returns validation error for invalid connect payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'employer-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    await expect(
      (globalThis as any).$fetch('/api/payments/methods/connect', {
        method: 'POST',
        body: { role: 'invalid', method_type: 'card' },
      })
    ).rejects.toThrow();
  });
});
