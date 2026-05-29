import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery, getRouterParam } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

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
    auth: vi.fn(() => Promise.resolve({})),
    general: vi.fn(() => Promise.resolve({})),
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

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  url: 'http://localhost',
  ...overrides,
});

const validSignUpBody = {
  email: 'newuser@example.com',
  password: 'SecurePass1',
  username: 'newuser',
  first_name: 'New',
  last_name: 'User',
  postcode: 'SW1A 1AA',
  role: 'employer' as const,
};

describe('Auth Lifecycle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/signup.post');
      handler = imported;
    });

    it('creates a new user with valid registration data', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { maybeSingle: null },
        },
        auth: {
          signUp: { data: { user: { id: 'new-user-1', email: validSignUpBody.email } }, error: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'POST', body: validSignUpBody }));

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('new-user-1');
      expect(result.user.email).toBe(validSignUpBody.email);
    });

    it('rejects signup when username is already taken', async () => {
      const mockClient = createSupabaseMock({
        from: {
          profiles: { maybeSingle: { username: validSignUpBody.username } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST', body: validSignUpBody }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Username is already taken');
      }
    });

    it('rejects signup with invalid email format', async () => {
      const body = { ...validSignUpBody, email: 'not-an-email' };

      try {
        await handler(createEvent({ method: 'POST', body }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('VALIDATION_FAILED');
      }
    });

    it('rejects signup with weak password', async () => {
      const body = { ...validSignUpBody, password: 'weak' };

      try {
        await handler(createEvent({ method: 'POST', body }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('VALIDATION_FAILED');
      }
    });

    it('rejects signup with invalid role', async () => {
      const body = { ...validSignUpBody, role: 'admin' };

      try {
        await handler(createEvent({ method: 'POST', body }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('VALIDATION_FAILED');
      }
    });
  });

  describe('GET /api/auth/me', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/me.get');
      handler = imported;
    });

    it('returns current user with roles when authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: { roles: ['employer', 'worker'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'GET' }));

      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.roles).toEqual(['employer', 'worker']);
    });

    it('returns empty roles when profile has no roles set', async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });

      const mockClient = createSupabaseMock({
        from: {
          profiles: { single: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'GET' }));

      expect(result.user.id).toBe('user-1');
      expect(result.user.roles).toEqual([]);
    });

    it('throws 401 when user is not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({ method: 'GET' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/auth/signout', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/signout.post');
      handler = imported;
    });

    it('signs out successfully and returns success', async () => {
      const mockClient = createSupabaseMock({
        auth: {
          signOut: { error: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({ method: 'POST' }));

      expect(result).toEqual({ success: true });
    });

    it('throws 400 when signout fails', async () => {
      const mockClient = createSupabaseMock({
        auth: {
          signOut: { error: { message: 'Session expired' } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      try {
        await handler(createEvent({ method: 'POST' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Session expired');
      }
    });
  });

  describe('Full auth lifecycle', () => {
    it('end-to-end: signup, fetch me, then signout', async () => {
      // 1. Signup
      const signupMockClient = createSupabaseMock({
        from: {
          profiles: { maybeSingle: null },
        },
        auth: {
          signUp: { data: { user: { id: 'lifecycle-user', email: 'lifecycle@example.com' } }, error: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(signupMockClient);

      const { default: signupHandler } = await import('~/server/api/auth/signup.post');
      const signupResult = await signupHandler(
        createEvent({ method: 'POST', body: validSignUpBody })
      );
      expect(signupResult.user!.id).toBe('lifecycle-user');

      // 2. Me
      mockServerSupabaseUser.mockResolvedValue({
        id: 'lifecycle-user',
        email: 'lifecycle@example.com',
      });

      const meMockClient = createSupabaseMock({
        from: {
          profiles: { single: { roles: ['employer'] } },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(meMockClient);

      const { default: meHandler } = await import('~/server/api/auth/me.get');
      const meResult = await meHandler(createEvent({ method: 'GET' }));
      expect(meResult.user.id).toBe('lifecycle-user');
      expect(meResult.user.roles).toEqual(['employer']);

      // 3. Signout
      const signoutMockClient = createSupabaseMock({
        auth: {
          signOut: { error: null },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(signoutMockClient);

      const { default: signoutHandler } = await import('~/server/api/auth/signout.post');
      const signoutResult = await signoutHandler(createEvent({ method: 'POST' }));
      expect(signoutResult).toEqual({ success: true });
    });
  });
});
