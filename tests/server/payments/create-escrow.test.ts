import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONTRACT_ID = '123e4567-e89b-12d3-a456-426614174000';
const EMPLOYER_ID = '223e4567-e89b-12d3-a456-426614174001';

const mocks = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsertSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));
  const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq
  }));

  const mockReadBody = vi.fn();
  const mockCreateError = vi.fn((opts: any) => {
    const err = new Error(opts.statusMessage) as any;
    Object.assign(err, opts);
    return err;
  });
  const mockUser = vi.fn();

  (globalThis as any).defineEventHandler = (fn: any) => fn;
  (globalThis as any).readBody = mockReadBody;
  (globalThis as any).createError = mockCreateError;

  return {
    mockSingle,
    mockMaybeSingle,
    mockSelect,
    mockInsertSelect,
    mockInsert,
    mockEq,
    mockFrom,
    mockReadBody,
    mockCreateError,
    mockUser
  };
});

vi.mock('#supabase/server', () => ({
  serverSupabaseUser: mocks.mockUser,
  serverSupabaseClient: vi.fn(async () => ({ from: mocks.mockFrom }))
}));

import handler from '~/server/api/payments/create-escrow.post';

const mockEvent = {} as any;

const validContract = {
  id: CONTRACT_ID,
  employer_id: EMPLOYER_ID,
  worker_id: '323e4567-e89b-12d3-a456-426614174002',
  job_id: '423e4567-e89b-12d3-a456-426614174003',
  status: 'pending',
  job: { budget_amount: 100 }
};

const mockEscrow = {
  id: '523e4567-e89b-12d3-a456-426614174004',
  contract_id: CONTRACT_ID,
  stripe_payment_intent_id: 'pi_mock_xxx',
  total_amount: 115,
  platform_fee: 15,
  worker_payout_amount: 100,
  status: 'held'
};

describe('POST /api/payments/create-escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUser.mockResolvedValue({ id: EMPLOYER_ID });
    mocks.mockReadBody.mockResolvedValue({ contract_id: CONTRACT_ID });

    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: validContract, error: null }) }) })
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: mockEscrow, error: null }) }) })
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });
  });

  it('creates escrow and returns payment intent for valid employer', async () => {
    const result = await handler(mockEvent);
    expect(result).toHaveProperty('payment_intent');
    expect(result.payment_intent.id).toMatch(/^pi_mock_/);
    expect(result.payment_intent.currency).toBe('gbp');
    expect(result).toHaveProperty('fee_breakdown');
    expect(result.fee_breakdown.total_amount).toBe(115);
    expect(result.fee_breakdown.platform_fee_amount).toBe(15);
  });

  it('rejects unauthenticated requests', async () => {
    mocks.mockUser.mockResolvedValue(null);
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects non-employer trying to pay', async () => {
    mocks.mockUser.mockResolvedValue({ id: 'someone-else' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects if contract is already active', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { ...validContract, status: 'active' }, error: null })
            })
          })
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects if escrow already exists', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: validContract, error: null }) }) })
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'existing' }, error: null })
            })
          })
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects invalid contract_id format', async () => {
    mocks.mockReadBody.mockResolvedValue({ contract_id: 'not-a-uuid' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
  });
});
