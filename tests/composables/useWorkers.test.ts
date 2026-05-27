import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkers } from '~/composables/useWorkers';

const mockFetch = vi.fn();

describe('useWorkers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('calls /api/public/workers without params when no arguments given', async () => {
    mockFetch.mockResolvedValue({ workers: [] });
    const { listPublicWorkers } = useWorkers();

    const result = await listPublicWorkers();

    expect(mockFetch).toHaveBeenCalledWith('/api/public/workers', { params: {} });
    expect(result).toEqual({ workers: [] });
  });

  it('passes limit as string when provided', async () => {
    mockFetch.mockResolvedValue({ workers: [{ id: '1' }] });
    const { listPublicWorkers } = useWorkers();

    await listPublicWorkers(10);

    expect(mockFetch).toHaveBeenCalledWith('/api/public/workers', { params: { limit: '10' } });
  });

  it('passes category when provided', async () => {
    mockFetch.mockResolvedValue({ workers: [] });
    const { listPublicWorkers } = useWorkers();

    await listPublicWorkers(undefined, 'cleaning');

    expect(mockFetch).toHaveBeenCalledWith('/api/public/workers', { params: { category: 'cleaning' } });
  });

  it('passes both limit and category when provided', async () => {
    mockFetch.mockResolvedValue({ workers: [] });
    const { listPublicWorkers } = useWorkers();

    await listPublicWorkers(5, 'gardening');

    expect(mockFetch).toHaveBeenCalledWith('/api/public/workers', {
      params: { limit: '5', category: 'gardening' }
    });
  });

  it('propagates fetch errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { listPublicWorkers } = useWorkers();

    await expect(listPublicWorkers()).rejects.toThrow('Network error');
  });
});
