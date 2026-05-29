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
  sendNotificationEmail: vi.fn(() => Promise.resolve()),
  getUserDetails: vi.fn(() => Promise.resolve({ firstName: 'Alice', lastName: 'Smith' })),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' } },
  query: {},
  ...overrides,
});

describe('Contracts Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', email: 'test@example.com' });
  });

  describe('POST /api/contracts', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/contracts/index.post');
      handler = imported;
    });

    it('creates a contract for valid application', async () => {
      const payload = {
        application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
        worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
      };
      const contract = { id: 'contract-1', ...payload, status: 'pending', created_at: '2024-01-01', updated_at: '2024-01-01' };

      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: payload.employer_id } },
          applications: { single: { id: payload.application_id, job_id: payload.job_id, worker_id: payload.worker_id, status: 'accepted' } },
          contracts: { insertSingle: contract },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'POST', body: payload }));
      expect(result.contract.id).toBe('contract-1');
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ method: 'POST', body: {} }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 400 when application is not accepted', async () => {
      const payload = {
        application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
        worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
      };

      const mockClient = createSupabaseMock({
        from: {
          jobs: { single: { employer_id: payload.employer_id } },
          applications: { single: { id: payload.application_id, job_id: payload.job_id, worker_id: payload.worker_id, status: 'pending' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: payload }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Contract can only be created for accepted applications');
      }
    });
  });
});
