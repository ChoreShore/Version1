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

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Contracts ID GET Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/contracts/:id', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/contracts/[id].get');
      handler = imported;
    });

    it('returns contract for participant', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const contract = {
        id: contractId,
        application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892',
        employer_id: 'user-1',
        worker_id: 'worker-1',
        job_id: jobId,
        status: 'active',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        job: { title: 'Gardening', budget_amount: 100 },
        employer: { first_name: 'Alice', last_name: 'Smith' },
        worker: { username: 'bob', first_name: 'Bob', last_name: 'Jones', bio: 'Gardener' },
      };
      const mockClient = createSupabaseMock({
        from: {
          contracts: { single: contract },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ context: { params: { id: contractId } } }));
      expect(result.contract.id).toBe(contractId);
      expect(result.contract.job_title).toBe('Gardening');
      expect(result.contract.employer_first_name).toBe('Alice');
      expect(result.contract.worker_first_name).toBe('Bob');
      expect(result.contract.worker_username).toBe('bob');
    });

    it('throws 404 when contract not found', async () => {
      const contractId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const mockClient = createSupabaseMock({
        from: {
          contracts: { single: null, error: { code: 'PGRST116', message: 'not found' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ context: { params: { id: contractId } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
        expect(error.statusMessage).toBe('Contract not found');
      }
    });

    it('throws 400 for invalid contract ID format', async () => {
      try {
        await handler(createEvent({ context: { params: { id: 'not-a-uuid' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Invalid Contract ID format');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ context: { params: { id: 'any-id' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
