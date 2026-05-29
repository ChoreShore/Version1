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

describe('Applications ID GET Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('GET /api/applications/:id', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/applications/[id].get');
      handler = imported;
    });

    it('returns application for worker owner', async () => {
      const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      mockServerSupabaseUser.mockResolvedValue({ id: 'worker-1' });

      const mockClient = createSupabaseMock({
        from: {
          applications: {
            single: {
              id: appId, job_id: jobId, worker_id: 'worker-1', status: 'pending',
              cover_letter: 'Hi', proposed_rate: 25, withdrawal_reason: null,
              created_at: '2024-01-01', updated_at: '2024-01-01',
              job: { id: jobId, title: 'Gardening', description: 'Weed garden', employer_id: 'employer-1' }
            },
          },
          profiles: { single: { id: 'worker-1', first_name: 'Alice', last_name: 'Smith' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ context: { params: { id: appId } } }));
      expect(result.application.id).toBe(appId);
      expect(result.application.status).toBe('pending');
      expect(result.application.cover_letter).toBe('Hi');
    });

    it('returns application for job employer', async () => {
      const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1' });

      const mockClient = createSupabaseMock({
        from: {
          applications: {
            single: {
              id: appId, job_id: jobId, worker_id: 'worker-1', status: 'pending',
              cover_letter: 'Hi', proposed_rate: 25, withdrawal_reason: null,
              created_at: '2024-01-01', updated_at: '2024-01-01',
              job: { id: jobId, title: 'Gardening', description: 'Weed garden', employer_id: 'employer-1' }
            },
          },
          jobs: { single: { id: jobId, employer_id: 'employer-1' } },
          profiles: { single: { id: 'employer-1', first_name: 'Bob', last_name: 'Jones' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ context: { params: { id: appId } } }));
      expect(result.application.id).toBe(appId);
      expect(result.application.status).toBe('pending');
    });

    it('throws 400 when application ID is missing', async () => {
      try {
        await handler(createEvent({ context: { params: { id: '' } } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Application ID is required');
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
