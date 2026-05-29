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

describe('Messages Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'employer-1', email: 'employer@test.com' });
    const integrationFetch = createIntegrationFetch();
    (globalThis as any).$fetch = integrationFetch;
  });

  it('sends a message end-to-end as employer', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const appId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892';
    const msgId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { id: jobId, title: 'Gardening', employer_id: 'employer-1' } },
        applications: {
          single: { id: appId, job_id: jobId, worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', status: 'pending' },
          maybeSingle: { id: appId, job_id: jobId, worker_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899', status: 'pending' },
        },
        profiles: { single: { id: 'employer-1', first_name: 'Alice', last_name: 'Smith' } },
        messages: {
          insertSingle: {
            id: msgId,
            job_id: jobId,
            application_id: appId,
            sender_id: 'employer-1',
            receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
            body: 'Hello!',
            created_at: '2024-01-01',
            sender: { username: 'alice', id: 'employer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
            receiver: { username: 'bob', id: 'worker-1', first_name: 'Bob', last_name: 'Jones', bio: null },
          },
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useMessages } = await import('~/composables/useMessages');
    const { sendMessage } = useMessages();
    const result = await sendMessage({
      job_id: jobId,
      application_id: appId,
      receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
      body: 'Hello!',
    });

    expect(result.message.id).toBe(msgId);
    expect(result.message.body).toBe('Hello!');
    expect(result.message.sender_id).toBe('employer-1');
    expect(result.message.receiver_id).toBe('a1b2c3d4-e5f6-4aaa-abcd-ef1234567899');
  });

  it('gets messages for a job end-to-end', async () => {
    const jobId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891';
    const msgId = 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567893';

    const mockClient = createSupabaseMock({
      from: {
        jobs: { single: { id: jobId, title: 'Gardening', employer_id: 'employer-1' } },
        applications: {
          maybeSingle: { id: 'app-1', job_id: jobId, worker_id: 'employer-1', status: 'pending' },
        },
        messages: {
          select: [
            {
              id: msgId,
              job_id: jobId,
              application_id: 'app-1',
              sender_id: 'worker-1',
              receiver_id: 'employer-1',
              body: 'Hi there',
              created_at: '2024-01-01',
              sender: { username: 'bob', id: 'worker-1', first_name: 'Bob', last_name: 'Jones', bio: null },
              receiver: { username: 'alice', id: 'employer-1', first_name: 'Alice', last_name: 'Smith', bio: null },
            },
          ],
        },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useMessages } = await import('~/composables/useMessages');
    const { getJobMessages } = useMessages();
    const result = await getJobMessages(jobId);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].body).toBe('Hi there');
    expect(result.pagination?.limit).toBe(50);
  });

  it('returns validation error for empty message body', async () => {
    const mockClient = createSupabaseMock({
      from: {
        profiles: { single: { id: 'employer-1', roles: ['employer'] } },
      },
    });
    mockServerSupabaseClient.mockResolvedValue(mockClient);

    const { useMessages } = await import('~/composables/useMessages');
    const { sendMessage } = useMessages();

    await expect(sendMessage({
      job_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
      application_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567892',
      receiver_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567899',
      body: '',
    })).rejects.toThrow();
  });
});
