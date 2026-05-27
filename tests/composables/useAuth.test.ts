import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useAuth } from '~/composables/useAuth';

const mockFetch = vi.fn();
const mockUser = ref({ id: 'user-1', email: 'test@example.com' });

// Mock $fetch via Vitest's stubGlobal for proper interception
vi.stubGlobal('$fetch', mockFetch);
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
      username: 'janedoe',
      first_name: 'Jane',
      last_name: 'Doe',
      postcode: 'SW1A 1AA',
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
      username: 'ab',
      first_name: 'A',
      last_name: 'B',
      postcode: 'SW1A 1AA',
      role: 'employer' as const
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(auth.signup({
      email: 'a@b.com',
      password: 'Password1',
      username: 'ab',
      first_name: 'A',
      last_name: 'B',
      postcode: 'SW1A 1AA',
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
      .rejects.toThrow('Invalid credentials');
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

    const result = await auth.addRole('worker');

    expect(result).toEqual({ roles: ['employer', 'worker'] });
  });

  it('works for the "employer" role', async () => {
    mockFetch.mockResolvedValue({ roles: ['employer'] });

    const result = await auth.addRole('employer');

    expect(result).toEqual({ roles: ['employer'] });
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

// ─── updateEmail ──────────────────────────────────────────────────────────────

describe('updateEmail', () => {
  const payload = {
    newEmail: 'new@example.com',
    confirmEmail: 'new@example.com',
    currentPassword: 'MyPassword1'
  };

  it('POSTs to /api/auth/update-email with the payload', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Check your email' });

    await auth.updateEmail(payload);

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/update-email', {
      method: 'POST',
      body: payload
    });
  });

  it('returns the success response', async () => {
    mockFetch.mockResolvedValue({ success: true, message: 'Check your email' });

    const result = await auth.updateEmail(payload);

    expect(result).toEqual({ success: true, message: 'Check your email' });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue({ statusCode: 401, statusMessage: 'Current password is incorrect' });
    await expect(auth.updateEmail(payload)).rejects.toThrow('Current password is incorrect');
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
    await expect(auth.deleteAccount(payload)).rejects.toThrow('Forbidden');
  });
});

// ─── signout ──────────────────────────────────────────────────────────────────

describe('signout', () => {
  it('POSTs to /api/auth/signout with no body', async () => {
    mockFetch.mockResolvedValue({ success: true });

    const result = await auth.signout();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/signout', { method: 'POST' });
    expect(result).toEqual({ success: true });
  });

  it('calls fetch exactly once', async () => {
    mockFetch.mockResolvedValue({ success: true });
    await auth.signout();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Session expired'));
    await expect(auth.signout()).rejects.toThrow('Session expired');
  });
});
