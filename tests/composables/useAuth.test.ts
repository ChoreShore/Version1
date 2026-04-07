import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

const mockFetch = vi.fn();
const mockUser = ref({ id: 'user-1', email: 'test@example.com' });

// Stub Nuxt auto-imports on globalThis before the composable is called
(globalThis as any).$fetch = mockFetch;
(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);

beforeEach(() => {
  mockFetch.mockReset();
});

const auth = useAuth();

// ─── user ─────────────────────────────────────────────────────────────────────

describe('user', () => {
  it('exposes the value returned by useSupabaseUser', () => {
    expect(auth.user).toBe(mockUser);
    expect(auth.user.value?.email).toBe('test@example.com');
  });
});

// ─── signup ───────────────────────────────────────────────────────────────────

describe('signup', () => {
  it('POSTs to /api/auth/signup with the payload', async () => {
    mockFetch.mockResolvedValue(undefined);

    const payload = {
      email: 'new@example.com',
      password: 'Password1',
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'worker' as const
    };

    await auth.signup(payload);

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signup', {
      method: 'POST',
      body: payload
    });
  });

  it('calls fetch exactly once', async () => {
    mockFetch.mockResolvedValue(undefined);
    await auth.signup({
      email: 'a@b.com',
      password: 'Password1',
      first_name: 'A',
      last_name: 'B',
      role: 'employer' as const
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(auth.signup({
      email: 'a@b.com',
      password: 'Password1',
      first_name: 'A',
      last_name: 'B',
      role: 'worker' as const
    })).rejects.toThrow('Network error');
  });
});

// ─── signin ───────────────────────────────────────────────────────────────────

describe('signin', () => {
  it('POSTs to /api/auth/signin with the payload', async () => {
    mockFetch.mockResolvedValue(undefined);

    await auth.signin({ email: 'user@example.com', password: 'Password1' });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signin', {
      method: 'POST',
      body: { email: 'user@example.com', password: 'Password1' }
    });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, statusMessage: 'Invalid credentials' });
    await expect(auth.signin({ email: 'x@y.com', password: 'wrong' }))
      .rejects.toMatchObject({ statusCode: 401 });
  });
});

// ─── addRole ──────────────────────────────────────────────────────────────────

describe('addRole', () => {
  it('POSTs to /api/auth/add-role with the role in the body', async () => {
    mockFetch.mockResolvedValue({ roles: ['employer', 'worker'] });

    await auth.addRole('worker');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/add-role', {
      method: 'POST',
      body: { role: 'worker' }
    });
  });

  it('returns the roles array from the response', async () => {
    mockFetch.mockResolvedValue({ roles: ['employer', 'worker'] });

    const roles = await auth.addRole('worker');

    expect(roles).toEqual(['employer', 'worker']);
  });

  it('works for the "employer" role', async () => {
    mockFetch.mockResolvedValue({ roles: ['employer'] });

    const roles = await auth.addRole('employer');

    expect(roles).toEqual(['employer']);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/add-role', {
      method: 'POST',
      body: { role: 'employer' }
    });
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────

describe('resetPassword', () => {
  it('POSTs to /api/auth/reset-password with the email in the body', async () => {
    mockFetch.mockResolvedValue(undefined);

    await auth.resetPassword('user@example.com');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
      method: 'POST',
      body: { email: 'user@example.com' }
    });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Server error'));
    await expect(auth.resetPassword('user@example.com')).rejects.toThrow('Server error');
  });
});

// ─── updatePassword ───────────────────────────────────────────────────────────

describe('updatePassword', () => {
  const payload = {
    currentPassword: 'OldPassword1',
    newPassword: 'NewPassword1',
    confirmPassword: 'NewPassword1'
  };

  it('POSTs to /api/auth/update-password with the payload', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Password updated' });

    await auth.updatePassword(payload);

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/update-password', {
      method: 'POST',
      body: payload
    });
  });

  it('returns the success response', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Password updated' });

    const result = await auth.updatePassword(payload);

    expect(result).toEqual({ success: true, message: 'Password updated' });
  });

  it('returns a failure response without throwing', async () => {
    mockFetch.mockResolvedValue({ success: false, message: 'Current password incorrect' });

    const result = await auth.updatePassword(payload);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Current password incorrect');
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  const payload = { confirmation: 'DELETE' as const, password: 'MyPassword1' };

  it('sends a DELETE request to /api/auth/delete-account with the payload', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Account deleted' });

    await auth.deleteAccount(payload);

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/delete-account', {
      method: 'DELETE',
      body: payload
    });
  });

  it('returns the success response', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Account deleted' });

    const result = await auth.deleteAccount(payload);

    expect(result).toEqual({ success: true, message: 'Account deleted' });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue({ statusCode: 403, statusMessage: 'Forbidden' });
    await expect(auth.deleteAccount(payload)).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─── signout ──────────────────────────────────────────────────────────────────

describe('signout', () => {
  it('POSTs to /api/auth/signout with no body', async () => {
    mockFetch.mockResolvedValue(undefined);

    await auth.signout();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signout', { method: 'POST' });
  });

  it('calls fetch exactly once', async () => {
    mockFetch.mockResolvedValue(undefined);
    await auth.signout();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Session expired'));
    await expect(auth.signout()).rejects.toThrow('Session expired');
  });
});
