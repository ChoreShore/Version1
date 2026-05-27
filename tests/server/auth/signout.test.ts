import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';

// Set h3 globals for server handlers
(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;

const mockSignOut = vi.fn();
const mockServerSupabaseClient = vi.fn(() => Promise.resolve({ auth: { signOut: mockSignOut } }));
const mockServerSupabaseUser = vi.fn();

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: mockServerSupabaseClient,
  serverSupabaseUser: mockServerSupabaseUser,
}));

describe('POST /api/auth/signout', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
    const { default: importedHandler } = await import('~/server/api/auth/signout.post');
    handler = importedHandler;
  });

  const createEvent = (overrides: any = {}) => ({
    body: {},
    headers: {},
    method: 'POST',
    ...overrides
  });

  it('returns success when signout succeeds', async () => {
    const result = await handler(createEvent());
    expect(result).toEqual({ success: true });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('throws 400 when signout returns an error', async () => {
    mockSignOut.mockResolvedValue({ error: { message: 'Session expired' } });

    try {
      await handler(createEvent());
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Session expired');
    }
  });
});
