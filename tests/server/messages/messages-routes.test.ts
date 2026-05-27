import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockFrom: any = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    or: vi.fn(() => ({
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => Promise.resolve({ error: null })),
  })),
  insert: vi.fn(() => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

const mockClient = {
  from: mockFrom,
};

const mockServerSupabaseClient = vi.fn(() => Promise.resolve(mockClient));
const mockServerSupabaseUser: any = vi.fn(() => Promise.resolve({ id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', email: 'test@example.com' }));

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
  },
}));

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
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

describe('Messages Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', email: 'test@example.com' });
  });

  describe('GET /api/messages', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/messages/index.get');
      handler = imported;
    });

    it('returns conversations for authenticated user', async () => {
      const messages = [
        {
          id: 'msg-1',
          application_id: 'app-1',
          job_id: 'job-1',
          sender_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
          receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
          body: 'Hello',
          sent_at: '2024-01-01',
          job: { title: 'Gardening' },
          application: { id: 'app-1', job_id: 'job-1', worker_id: 'user-2' },
          sender: { first_name: 'Alice', last_name: 'Smith' },
          receiver: { first_name: 'Bob', last_name: 'Jones' },
        },
      ];

      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: messages, error: null })),
          })),
        })),
      }));

      const result = await handler(createEvent());
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].job_title).toBe('Gardening');
    });

    it('throws 400 on database error', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'db error' } })),
          })),
        })),
      }));

      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('POST /api/messages', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/messages/index.post');
      handler = imported;
    });

    it('creates a message successfully', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
      const payload = {
        job_id: jobId,
        application_id: applicationId,
        receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898',
        body: 'Hello there',
      };

      const chainableQuery = (terminalFn: () => any) => {
        const self: any = {
          eq: vi.fn(() => self),
          single: vi.fn(terminalFn),
          maybeSingle: vi.fn(terminalFn),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        return self;
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: { id: jobId, title: 'Gardening', employer_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899' }, error: null }))),
          };
        }
        if (table === 'applications') {
          return {
            select: vi.fn(() => chainableQuery(() => Promise.resolve({
              data: { id: applicationId, job_id: jobId, worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898', status: 'accepted' },
              error: null,
            }))),
          };
        }
        if (table === 'messages') {
          return {
            select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: null, error: null }))),
            insert: vi.fn(() => ({
              select: vi.fn(() => chainableQuery(() => Promise.resolve({
                data: { id: 'msg-1', ...payload, sender_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899' },
                error: null,
              }))),
            })),
          };
        }
        return {
          select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: null, error: null }))),
        };
      });

      const result = await handler(createEvent({ method: 'POST', body: payload }));
      expect(result.message.body).toBe('Hello there');
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ method: 'POST', body: {} }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 403 when sender is not authorized', async () => {
      const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890';
      const applicationId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';

      const chainableQuery = (terminalFn: () => any) => {
        const self: any = {
          eq: vi.fn(() => self),
          single: vi.fn(terminalFn),
          maybeSingle: vi.fn(terminalFn),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        return self;
      };

      mockFrom.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: { id: jobId, title: 'Gardening', employer_id: 'other-user' }, error: null }))),
          };
        }
        if (table === 'applications') {
          return {
            select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: null, error: null }))),
          };
        }
        return {
          select: vi.fn(() => chainableQuery(() => Promise.resolve({ data: null, error: null }))),
        };
      });

      try {
        await handler(createEvent({
          method: 'POST',
          body: { job_id: jobId, application_id: applicationId, receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567898', body: 'Hello' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });
  });
});
