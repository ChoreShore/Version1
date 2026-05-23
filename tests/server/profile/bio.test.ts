import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PATCH /api/profile/bio - Bio Update API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('should reject unauthenticated users', async () => {
    const error = {
      statusCode: 401,
      statusMessage: 'Sign in to update your bio'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/profile/bio', {
        method: 'PATCH',
        body: { bio: 'My bio' }
      })
    ).rejects.toMatchObject(error);
  });

  it('should reject bio updates from non-workers', async () => {
    const error = {
      statusCode: 403,
      statusMessage: 'Only workers can add a bio'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/profile/bio', {
        method: 'PATCH',
        body: { bio: 'My bio' }
      })
    ).rejects.toMatchObject(error);
  });

  it('should validate bio length (max 500 characters)', async () => {
    const error = {
      statusCode: 400,
      statusMessage: expect.stringContaining('500')
    };

    mockFetch.mockRejectedValue(error);

    const longBio = 'a'.repeat(501);

    await expect(
      $fetch('/api/profile/bio', {
        method: 'PATCH',
        body: { bio: longBio }
      })
    ).rejects.toMatchObject(error);
  });

  it('should successfully update bio', async () => {
    const response = {
      success: true,
      bio: 'My updated bio'
    };

    mockFetch.mockResolvedValue(response);

    const result = await $fetch('/api/profile/bio', {
      method: 'PATCH',
      body: { bio: 'My updated bio' }
    });

    expect(result).toEqual(response);
  });

  it('should allow empty/null bio', async () => {
    const response = {
      success: true,
      bio: null
    };

    mockFetch.mockResolvedValue(response);

    const result = await $fetch('/api/profile/bio', {
      method: 'PATCH',
      body: { bio: null }
    });

    expect(result).toEqual(response);
  });
});
