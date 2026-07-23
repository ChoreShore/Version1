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

vi.mock('~/server/utils/email', () => ({
  sendNotificationEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logDetailedError: vi.fn(),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'worker-1' }, params: {} },
  query: {},
  ...overrides,
});

const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

describe('POST /api/contracts/[id]/complete', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1', email: 'worker@example.com' });
    const { default: imported } = await import('~/server/api/contracts/[id]/complete.post');
    handler = imported;
  });

  it('marks active contract as complete when worker requests', async () => {
    const initialContract = {
      id: contractId,
      employer_id: 'employer-1',
      worker_id: 'worker-1',
      job_id: jobId,
      status: 'active'
    };
    const updatedContract = {
      id: contractId,
      status: 'pending_review',
      worker_completed_at: new Date().toISOString(),
      job: { title: 'Gardening', budget_amount: 100 },
      employer: { first_name: 'Alice', last_name: 'Smith' },
      worker: { username: 'bob', first_name: 'Bob', last_name: 'Jones', bio: 'Gardener' },
    };

    let singleCallCount = 0;
    const mockClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => {
              singleCallCount++;
              return Promise.resolve({
                data: singleCallCount === 1 ? initialContract : updatedContract,
                error: null
              });
            }
          })
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedContract, error: null })
            })
          })
        })
      })
    };
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const result = await handler(createEvent({ context: { params: { id: contractId } } }));

    expect(result.success).toBe(true);
    expect(result.contract.status).toBe('pending_review');
  });

  it('throws 403 when employer tries to mark complete', async () => {
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@example.com' });

    const mockClient = createSupabaseMock({
      from: {
        contracts: { single: { id: contractId, employer_id: 'employer-1', worker_id: 'worker-1', job_id: jobId, status: 'active' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    try {
      await handler(createEvent({ context: { params: { id: contractId } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(403);
      expect(error.statusMessage).toContain('Only the worker');
    }
  });

  it('throws 400 when contract is not active', async () => {
    const mockClient = createSupabaseMock({
      from: {
        contracts: { single: { id: contractId, employer_id: 'employer-1', worker_id: 'worker-1', job_id: jobId, status: 'pending' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    try {
      await handler(createEvent({ context: { params: { id: contractId } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toContain('Only active contracts');
    }
  });

  it('throws 404 when contract not found', async () => {
    const mockClient = createSupabaseMock({
      from: {
        contracts: { single: null, error: { message: 'not found' } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    try {
      await handler(createEvent({ context: { params: { id: contractId } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(404);
    }
  });

  it('throws 401 when not authenticated', async () => {
    mockServerSupabaseUser.mockResolvedValue(null);

    try {
      await handler(createEvent({ context: { params: { id: contractId } } }));
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
    }
  });
});
