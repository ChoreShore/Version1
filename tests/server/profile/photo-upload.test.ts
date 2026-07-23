import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/profile/photo - Photo Upload API', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('should reject unauthenticated users', async () => {
    const error = {
      statusCode: 401,
      statusMessage: 'Sign in to upload a photo'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/profile/photo', {
        method: 'POST',
        body: new FormData()
      })
    ).rejects.toMatchObject(error);
  });

  it('should reject requests without a photo file', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Photo file is required'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      $fetch('/api/profile/photo', {
        method: 'POST',
        body: new FormData()
      })
    ).rejects.toMatchObject(error);
  });

  it('should validate file type', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Invalid file type. Allowed types: JPG, PNG, WebP'
    };

    mockFetch.mockRejectedValue(error);

    const formData = new FormData();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    formData.append('photo', file);

    await expect(
      $fetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      })
    ).rejects.toMatchObject(error);
  });

  it('should validate file size', async () => {
    const error = {
      statusCode: 400,
      statusMessage: expect.stringContaining('File size exceeds')
    };

    mockFetch.mockRejectedValue(error);

    const formData = new FormData();
    // Create a file larger than 5MB
    const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'test.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    await expect(
      $fetch('/api/profile/photo', {
        method: 'POST',
        body: formData
      })
    ).rejects.toMatchObject(error);
  });

  it('should successfully upload a valid photo', async () => {
    const response = {
      success: true,
      photoUrl: 'https://example.com/profile-photos/worker-photos/user-123/1234567890.jpg',
      path: 'worker-photos/user-123/1234567890.jpg'
    };

    mockFetch.mockResolvedValue(response);

    const formData = new FormData();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    formData.append('photo', file);

    const result = await $fetch('/api/profile/photo', {
      method: 'POST',
      body: formData
    });

    expect(result).toEqual(response);
  });
});
