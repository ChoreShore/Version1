import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/auth/check-username - Username Availability Check', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('should return available for new username', async () => {
    const response = {
      available: true,
      username: 'testuser'
    };

    mockFetch.mockResolvedValue(response);

    const result = await $fetch('/api/auth/check-username', {
      params: { username: 'testuser' }
    });

    expect(result).toEqual(response);
  });

  it('should return unavailable for existing username', async () => {
    const response = {
      available: false,
      username: 'takenuser'
    };

    mockFetch.mockResolvedValue(response);

    const result = await $fetch('/api/auth/check-username', {
      params: { username: 'takenuser' }
    });

    expect(result).toEqual(response);
  });

  it('should reject invalid username format', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Invalid username format'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/auth/check-username', {
        params: { username: 'invalid@user' }
      })
    ).rejects.toMatchObject(error);
  });

  it('should reject username longer than 12 characters', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Username must be at most 12 characters'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/auth/check-username', {
        params: { username: 'verylongusername' }
      })
    ).rejects.toMatchObject(error);
  });

  it('should require username parameter', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Username is required'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/auth/check-username')
    ).rejects.toMatchObject(error);
  });
});
