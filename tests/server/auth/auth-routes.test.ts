import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;

const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockRpc = vi.fn();
const mockFrom: any = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    order: vi.fn(() => ({ limit: vi.fn(() => ({ like: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })),
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
  auth: {
    signUp: mockSignUp,
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
  },
  from: mockFrom,
  rpc: mockRpc,
};

const mockServerSupabaseClient = vi.fn(() => Promise.resolve(mockClient));
const mockServerSupabaseUser: any = vi.fn(() => Promise.resolve({ id: 'user-1', email: 'test@example.com' }));

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
    emailChange: vi.fn(() => Promise.resolve({})),
    password: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('~/server/utils/errorMessages', () => ({
  getErrorMessage: vi.fn((key: string) => key),
  logDetailedError: vi.fn(),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  logDetailedError: vi.fn(),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' } },
  ...overrides,
});

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: { user: { id: 'new-user', email: 'new@example.com' } }, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));
  });

  describe('POST /api/auth/signup', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/signup.post');
      handler = imported;
    });

    it('creates a new user with valid data', async () => {
      const body = {
        email: 'new@example.com',
        password: 'MyPassword1',
        username: 'newuser',
        first_name: 'New',
        last_name: 'User',
        postcode: 'SW1A1AA',
        role: 'employer' as const,
      };
      const result = await handler(createEvent({ body }));
      expect(result.user).toBeDefined();
    });

    it('rejects when username is already taken', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: { username: 'taken' }, error: null })),
          })),
        })),
      }));

      const body = {
        email: 'new@example.com',
        password: 'MyPassword1',
        username: 'taken',
        first_name: 'New',
        last_name: 'User',
        postcode: 'SW1A1AA',
        role: 'employer' as const,
      };
      try {
        await handler(createEvent({ body }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Username is already taken');
      }
    });

    it('rejects invalid email', async () => {
      const body = { email: 'not-an-email', password: 'MyPassword1', username: 'u', first_name: 'F', last_name: 'L', postcode: 'SW1A', role: 'employer' };
      try {
        await handler(createEvent({ body }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('POST /api/auth/signin', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/signin.post');
      handler = imported;
    });

    it('returns user on successful signin', async () => {
      const result = await handler(createEvent({ body: { email: 'test@example.com', password: 'MyPassword1' } }));
      expect(result.user).toBeDefined();
    });

    it('throws 400 on invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: null, error: { message: 'Invalid login credentials' } });
      try {
        await handler(createEvent({ body: { email: 'test@example.com', password: 'wrong' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ body: { email: '', password: '' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('POST /api/auth/signout', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/signout.post');
      handler = imported;
    });

    it('returns success on signout', async () => {
      const result = await handler(createEvent());
      expect(result).toEqual({ success: true });
    });

    it('throws 400 on signout error', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Session not found' } });
      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Session not found');
      }
    });
  });

  describe('GET /api/auth/me', () => {
    let handler: any;

    beforeEach(async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      const { default: imported } = await import('~/server/api/auth/me.get');
      handler = imported;
    });

    it('returns user with roles', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { roles: ['employer'] }, error: null })),
          })),
        })),
      }));

      const result = await handler(createEvent({ method: 'GET' }));
      expect(result.user.roles).toEqual(['employer']);
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);
      try {
        await handler(createEvent({ method: 'GET' }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/reset-password.post');
      handler = imported;
    });

    it('returns success for valid email', async () => {
      const result = await handler(createEvent({ body: { email: 'test@example.com' } }));
      expect(result).toEqual({ success: true });
    });

    it('throws 400 on invalid email', async () => {
      try {
        await handler(createEvent({ body: { email: 'invalid' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('POST /api/auth/update-email', () => {
    let handler: any;

    beforeEach(async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'old@example.com' });
      const { default: imported } = await import('~/server/api/auth/update-email.post');
      handler = imported;
    });

    it('returns success for valid new email', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const result = await handler(createEvent({ body: { newEmail: 'new@example.com', confirmEmail: 'new@example.com', currentPassword: 'MyPassword1' } }));
      expect(result.success).toBe(true);
    });

    it('throws 400 when new email matches current email', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      try {
        await handler(createEvent({ body: { newEmail: 'old@example.com', confirmEmail: 'old@example.com', currentPassword: 'MyPassword1' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('throws 401 when current password is wrong', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
      try {
        await handler(createEvent({ body: { newEmail: 'new@example.com', confirmEmail: 'new@example.com', currentPassword: 'wrong' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/auth/update-password', () => {
    let handler: any;

    beforeEach(async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      const { default: imported } = await import('~/server/api/auth/update-password.post');
      handler = imported;
    });

    it('returns success for valid password change', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const result = await handler(createEvent({ body: { currentPassword: 'OldPass1', newPassword: 'NewPass2', confirmPassword: 'NewPass2' } }));
      expect(result.success).toBe(true);
    });

    it('throws 401 when current password is incorrect', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
      try {
        await handler(createEvent({ body: { currentPassword: 'wrong', newPassword: 'NewPass2', confirmPassword: 'NewPass2' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('DELETE /api/auth/delete-account', () => {
    let handler: any;

    beforeEach(async () => {
      mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
      const { default: imported } = await import('~/server/api/auth/delete-account.delete');
      handler = imported;
    });

    it('deletes account with correct password', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      mockRpc.mockResolvedValue({ error: null });
      const result = await handler(createEvent({ body: { confirmation: 'DELETE', password: 'MyPassword1' } }));
      expect(result.success).toBe(true);
    });

    it('throws 401 when password is incorrect', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
      try {
        await handler(createEvent({ body: { confirmation: 'DELETE', password: 'wrong' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('POST /api/auth/add-role', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/auth/add-role.post');
      handler = imported;
    });

    it('adds a new role to existing roles', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { roles: ['employer'] }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      const result = await handler(createEvent({ body: { role: 'worker' } }));
      expect(result.roles).toContain('employer');
      expect(result.roles).toContain('worker');
    });

    it('rejects invalid role', async () => {
      try {
        await handler(createEvent({ body: { role: 'admin' } }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
      }
    });
  });
});
