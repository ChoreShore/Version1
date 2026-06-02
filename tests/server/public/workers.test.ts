import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  // Build a mock chain for each table query
  let profilesData: any[] = [];
  let reviewsData: any[] = [];
  let contractsData: any[] = [];

  const setData = (profiles?: any[], reviews?: any[], contracts?: any[]) => {
    if (profiles) profilesData = profiles;
    if (reviews) reviewsData = reviews;
    if (contracts) contractsData = contracts;
  };

  const mockFrom = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          contains: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: profilesData, error: null }),
            }),
          }),
        }),
      };
    }

    if (table === 'reviews') {
      return {
        select: () => ({
          in: () => Promise.resolve({ data: reviewsData, error: null }),
        }),
      };
    }

    if (table === 'contracts') {
      return {
        select: () => ({
          in: () => ({
            eq: () => Promise.resolve({ data: contractsData, error: null }),
          }),
        }),
      };
    }

    return {
      select: () => Promise.resolve({ data: [], error: null }),
    };
  });

  const mockCreateClient = vi.fn(() => ({
    from: mockFrom,
  }));

  (globalThis as any).defineEventHandler = (fn: any) => fn;
  (globalThis as any).createError = (opts: any) => {
    const err = new Error(opts.statusMessage) as any;
    Object.assign(err, opts);
    return err;
  };
  (globalThis as any).getQuery = () => ({ limit: '10' });

  return { mockCreateClient, mockFrom, setData };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.mockCreateClient,
}));

import handler from '~/server/api/public/workers.get';

const mockEvent = {} as any;

describe('GET /api/public/workers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: 'Hello', photo_url: null, postcode: 'SW1A 1AA', created_at: '2026-01-01T00:00:00Z' },
        { id: 'w2', username: 'worker2', first_name: 'Bob', last_name: 'Jones', bio: null, photo_url: 'http://img.jpg', postcode: 'E1 1AA', created_at: '2026-02-01T00:00:00Z' },
      ],
      [],
      []
    );
  });

  it('returns workers array', async () => {
    const result = await handler(mockEvent);

    expect(Array.isArray(result.workers)).toBe(true);
    expect(result.workers.length).toBe(2);
  });

  it('queries profiles table with contains filter', async () => {
    await handler(mockEvent);

    expect(mocks.mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('returns anonymized display names', async () => {
    const result = await handler(mockEvent);

    expect(result.workers[0].display_name).toBe('A. Smith');
    expect(result.workers[1].display_name).toBe('B. Jones');
  });

  it('falls back to username when names are missing', async () => {
    mocks.setData([{ id: 'w3', username: 'anon', first_name: '', last_name: '', bio: null, photo_url: null, postcode: null, created_at: '2026-01-01T00:00:00Z' }]);

    const result = await handler(mockEvent);

    expect(result.workers[0].display_name).toBe('anon');
  });

  it('returns empty workers array when none found', async () => {
    mocks.setData([]);

    const result = await handler(mockEvent);

    expect(result.workers).toEqual([]);
  });

  it('throws 500 when Supabase config is missing', async () => {
    delete process.env.SUPABASE_URL;

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Supabase configuration missing',
    });
  });

  it('calculates average rating for each worker', async () => {
    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: null, photo_url: null, postcode: 'SW1A 1AA', created_at: '2026-01-01T00:00:00Z' },
      ],
      [
        { reviewed_user_id: 'w1', rating: 5 },
        { reviewed_user_id: 'w1', rating: 3 },
      ],
      []
    );

    const result = await handler(mockEvent);

    expect(result.workers[0].average_rating).toBe(4.0);
    expect(result.workers[0].total_reviews).toBe(2);
  });

  it('returns null average rating when no reviews exist', async () => {
    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: null, photo_url: null, postcode: 'SW1A 1AA', created_at: '2026-01-01T00:00:00Z' },
      ],
      [],
      []
    );

    const result = await handler(mockEvent);

    expect(result.workers[0].average_rating).toBeNull();
    expect(result.workers[0].total_reviews).toBe(0);
  });

  it('counts completed contracts per worker', async () => {
    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: null, photo_url: null, postcode: 'SW1A 1AA', created_at: '2026-01-01T00:00:00Z' },
        { id: 'w2', username: 'worker2', first_name: 'Bob', last_name: 'Jones', bio: null, photo_url: null, postcode: 'E1 1AA', created_at: '2026-02-01T00:00:00Z' },
      ],
      [],
      [
        { worker_id: 'w1', status: 'completed' },
        { worker_id: 'w1', status: 'completed' },
        { worker_id: 'w2', status: 'completed' },
      ]
    );

    const result = await handler(mockEvent);

    expect(result.workers[0].completed_jobs).toBe(2);
    expect(result.workers[1].completed_jobs).toBe(1);
  });

  it('extracts postcode area from full postcode', async () => {
    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: null, photo_url: null, postcode: 'SW1A 1AA', created_at: '2026-01-01T00:00:00Z' },
        { id: 'w2', username: 'worker2', first_name: 'Bob', last_name: 'Jones', bio: null, photo_url: null, postcode: 'E1 1AA', created_at: '2026-02-01T00:00:00Z' },
      ],
      [],
      []
    );

    const result = await handler(mockEvent);

    expect(result.workers[0].postcode_area).toBe('SW1A');
    expect(result.workers[1].postcode_area).toBe('E1');
  });

  it('returns null postcode area when postcode is missing', async () => {
    mocks.setData(
      [
        { id: 'w1', username: 'worker1', first_name: 'Alice', last_name: 'Smith', bio: null, photo_url: null, postcode: null, created_at: '2026-01-01T00:00:00Z' },
      ],
      [],
      []
    );

    const result = await handler(mockEvent);

    expect(result.workers[0].postcode_area).toBeNull();
  });
});
