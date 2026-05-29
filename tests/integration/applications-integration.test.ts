import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getRouterParam } from 'h3';
import { createSupabaseMock } from '../mocks/createSupabaseMock';
import { createIntegrationFetch } from '../helpers/integration';

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
}));

describe('Applications Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1', email: 'worker@test.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('lists applications end-to-end', async () => {
    const applications = [
      {
        id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
        worker_id: 'worker-1',
        status: 'pending',
        cover_letter: 'I am qualified',
        proposed_rate: 25,
        withdrawal_reason: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ];
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'worker-1', roles: ['worker'] } },
        applications: { select: applications },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useApplications } = await import('~/composables/useApplications');
    const { listMyApplications } = useApplications();
    const result = await listMyApplications();

    expect(result.applications).toHaveLength(1);
    expect(result.applications[0].status).toBe('pending');
  });

  it('creates an application end-to-end', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { id: jobId, employer_id: 'employer-1', status: 'open' } },
        profiles: { single: { id: 'worker-1', roles: ['worker'] } },
        applications: {
          select: [],
          insertSingle: {
            id: appId,
            job_id: jobId,
            worker_id: 'worker-1',
            status: 'pending',
            cover_letter: 'I am qualified',
            proposed_rate: 25,
            withdrawal_reason: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useApplications } = await import('~/composables/useApplications');
    const { createApplication } = useApplications();
    const result = await createApplication({
      job_id: jobId,
      cover_letter: 'I am qualified',
      proposed_rate: 25,
    });

    expect(result.application.id).toBe(appId);
    expect(result.application.status).toBe('pending');
  });

  it('patches an application end-to-end as employer', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@test.com' });

    const mockClient = createSupabaseMock({
      from: {
        applications: {
          single: {
            id: appId,
            job_id: jobId,
            worker_id: 'worker-1',
            status: 'pending',
            cover_letter: 'I am qualified',
            proposed_rate: 25,
            withdrawal_reason: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
        jobs: { single: { id: jobId, employer_id: 'employer-1', status: 'open', budget_type: 'hourly', budget_amount: 25 } },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
        contracts: { select: [], single: null },
        payments: { select: [], single: null },
        payment_transactions: { single: null },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useApplications } = await import('~/composables/useApplications');
    const { updateApplication } = useApplications();
    const result = await updateApplication(appId, { status: 'accepted' });

    expect(result.application.id).toBe(appId);
  });

  it('returns validation error for invalid application payload', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'worker-1', roles: ['worker'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useApplications } = await import('~/composables/useApplications');
    const { createApplication } = useApplications();

    await expect(createApplication({ job_id: 'not-a-uuid', cover_letter: '' } as any)).rejects.toThrow();
  });
});
