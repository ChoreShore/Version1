import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockServerSupabaseUser = vi.fn();

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: vi.fn(),
  serverSupabaseUser: mockServerSupabaseUser,
}));

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' } },
  query: {},
  ...overrides,
});

describe('POST /api/contracts/fix-worker-ids', () => {
  let handler: any;
  let mockFrom: any;
  let mockUpdate: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

    mockUpdate = vi.fn(() => Promise.resolve({ error: null }));

    const { serverSupabaseClient } = await import('#supabase/server');

    handler = (await import('~/server/api/contracts/fix-worker-ids.post')).default;
  });

  const setupMockClient = async (contractsData: any[], applicationsData: Record<string, any>, updateError: any = null) => {
    const mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'contracts') {
          return {
            select: vi.fn(() => ({
              is: vi.fn(() => ({
                then: (onFulfilled: any) => Promise.resolve({ data: contractsData, error: null }).then(onFulfilled),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                then: (onFulfilled: any) => Promise.resolve({ error: updateError }).then(onFulfilled),
              })),
            })),
          };
        }
        if (table === 'applications') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: applicationsData, error: null })),
                then: (onFulfilled: any) => Promise.resolve({ data: applicationsData, error: null }).then(onFulfilled),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
      }),
    };

    const { serverSupabaseClient } = await import('#supabase/server');
    vi.mocked(serverSupabaseClient).mockResolvedValue(mockClient as any);
  };

  it('returns success when no contracts need fixing', async () => {
    await setupMockClient([], {});

    const result = await handler(createEvent());
    expect(result.success).toBe(true);
    expect(result.fixed).toBe(0);
    expect(result.message).toBe('No contracts with missing worker_id found');
  });

  it('fixes contracts with missing worker_id from application', async () => {
    const contracts = [
      { id: 'contract-1', application_id: 'app-1', worker_id: null },
      { id: 'contract-2', application_id: 'app-2', worker_id: null },
    ];
    const applications: Record<string, any> = { worker_id: 'worker-1' };

    await setupMockClient(contracts, applications);

    const result = await handler(createEvent());
    expect(result.success).toBe(true);
    expect(result.fixed).toBe(2);
    expect(result.total).toBe(2);
  });

  it('collects errors when application has no worker_id', async () => {
    const contracts = [
      { id: 'contract-1', application_id: 'app-1', worker_id: null },
    ];
    const applications: Record<string, any> = { worker_id: null };

    await setupMockClient(contracts, applications);

    const result = await handler(createEvent());
    expect(result.success).toBe(true);
    expect(result.fixed).toBe(0);
    expect(result.errors).toBeDefined();
    expect(result.errors![0]).toContain('has no worker_id');
  });

  it('throws 400 when database fetch fails', async () => {
    const { serverSupabaseClient } = await import('#supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            then: (onFulfilled: any) => Promise.resolve({ data: null, error: { message: 'DB connection failed' } }).then(onFulfilled),
          })),
        })),
      })),
    };
    vi.mocked(serverSupabaseClient).mockResolvedValue(mockClient as any);

    try {
      await handler(createEvent());
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('DB connection failed');
    }
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
