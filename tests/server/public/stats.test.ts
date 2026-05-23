import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  const mockCreateClient = vi.fn(() => ({
    from: mockFrom,
  }));

  (globalThis as any).defineEventHandler = (fn: any) => fn;
  (globalThis as any).createError = (opts: any) => {
    const err = new Error(opts.statusMessage) as any;
    Object.assign(err, opts);
    return err;
  };
  (globalThis as any).getQuery = () => ({});

  return { mockCreateClient, mockFrom, mockSelect, mockEq, mockGte };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.mockCreateClient,
}));

import handler from '~/server/api/public/stats.get';

const mockEvent = {} as any;

describe('GET /api/public/stats', () => {
  beforeEach(() => {
    mocks.mockCreateClient.mockClear();
    mocks.mockFrom.mockClear();
    mocks.mockSelect.mockClear();
    mocks.mockEq.mockClear();
    mocks.mockGte.mockClear();

    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    // Build a chain that returns count queries
    const buildCountResponse = (count: number | null) =>
      Promise.resolve({ count, error: null });

    mocks.mockSelect.mockImplementation((_: any, opts?: any) => {
      if (opts?.count === 'exact') {
        return {
          eq: (field: string, value: any) => ({
            gte: (field2: string, value2: any) =>
              buildCountResponse(value === 'completed' ? 42 : value === 'open' ? 12 : 0),
          }),
        };
      }
      return {};
    });
  });

  it('returns stats object with correct shape', async () => {
    const result = await handler(mockEvent);

    expect(result).toHaveProperty('jobs_completed_this_week');
    expect(result).toHaveProperty('jobs_posted_today');
    expect(result).toHaveProperty('escrow_protected_payments');
  });

  it('returns numeric values for all stats', async () => {
    const result = await handler(mockEvent);

    expect(typeof result.jobs_completed_this_week).toBe('number');
    expect(typeof result.jobs_posted_today).toBe('number');
    expect(typeof result.escrow_protected_payments).toBe('number');
  });

  it('throws 500 when Supabase config is missing', async () => {
    delete process.env.SUPABASE_URL;

    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Supabase configuration missing',
    });
  });
});
