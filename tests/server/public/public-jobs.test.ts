import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL, getQuery } from 'h3';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getQuery = getQuery;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockFrom: any = vi.fn(() => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      order: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    in: vi.fn(() => Promise.resolve({ data: [], error: null })),
  })),
}));

const mockClient = {
  from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

vi.mock('~/server/utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logDetailedError: vi.fn(),
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'GET',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Public Jobs Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-key';
  });

  describe('GET /api/public/jobs', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/public/jobs.get');
      handler = imported;
    });

    it('returns public job previews', async () => {
      const jobs = [
        {
          id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
          title: 'Gardening',
          description: 'Weed the garden',
          category_id: 'cat-1',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          budget_amount: 100,
          is_urgent: true,
          is_recurring: false,
          created_at: '2024-01-01',
          employer_id: 'employer-1',
          category: { name: 'Gardening' },
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => Promise.resolve({ data: jobs, error: null })),
                })),
              })),
              in: vi.fn(() => Promise.resolve({ data: [{ employer_id: 'employer-1' }], error: null })),
            })),
          };
        }
        if (table === 'reviews') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        if (table === 'applications') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: [{ id: 'employer-1', first_name: 'Alice', last_name: 'Smith' }], error: null })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      });

      const result = await handler(createEvent());
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].title).toBe('Gardening');
      expect(result.jobs[0].employer.display_name).toBe('Alice S.');
      expect(result.jobs[0].tags).toContain('Urgent');
    });

    it('throws 500 when Supabase config missing', async () => {
      delete process.env.SUPABASE_URL;

      try {
        await handler(createEvent());
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
        expect(error.statusMessage).toBe('Supabase configuration missing');
      }
    });
  });
});
