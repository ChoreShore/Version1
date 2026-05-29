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

describe('Contracts Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@test.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('creates a contract end-to-end for accepted application', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { id: jobId, title: 'Gardening', employer_id: 'employer-1' } },
        applications: {
          single: { id: appId, job_id: jobId, worker_id: 'worker-1', status: 'accepted' },
        },
        contracts: {
          insertSingle: {
            id: contractId,
            application_id: appId,
            employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567880',
            worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567881',
            job_id: jobId,
            status: 'pending',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useContracts } = await import('~/composables/useContracts');
    const { createContract } = useContracts();
    const result = await createContract({
      application_id: appId,
      employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567880',
      worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567881',
      job_id: jobId,
    });

    expect(result.contract.id).toBe(contractId);
    expect(result.contract.status).toBe('pending');
  });

  it('gets a contract end-to-end', async () => {
    const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    const mockClient = createSupabaseMock({
      from: {
        contracts: {
          single: {
            id: contractId,
            application_id: 'app-1',
            employer_id: 'employer-1',
            worker_id: 'worker-1',
            job_id: jobId,
            status: 'pending',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            job: { title: 'Gardening', budget_amount: 100 },
            employer: { first_name: 'Alice', last_name: 'Smith' },
            worker: { username: 'bob', first_name: 'Bob', last_name: 'Jones', bio: null },
          },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useContracts } = await import('~/composables/useContracts');
    const { getContract } = useContracts();
    const result = await getContract(contractId);

    expect(result.contract.id).toBe(contractId);
    expect(result.contract.job_title).toBe('Gardening');
    expect(result.contract.employer_first_name).toBe('Alice');
    expect(result.contract.worker_username).toBe('bob');
  });

  it('rejects contract creation for non-accepted application', async () => {
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892';
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { id: jobId, title: 'Gardening', employer_id: 'employer-1' } },
        applications: {
          single: { id: appId, job_id: jobId, worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567881', status: 'pending' },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useContracts } = await import('~/composables/useContracts');
    const { createContract } = useContracts();

    await expect(createContract({
      application_id: appId,
      employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567880',
      worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567881',
      job_id: jobId,
    })).rejects.toThrow('Contract can only be created for accepted applications');
  });
});
