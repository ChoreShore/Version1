import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONTRACT_ID = '123e4567-e89b-12d3-a456-426614174000';
const EMPLOYER_ID = '223e4567-e89b-12d3-a456-426614174001';

const mocks = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
  const mockInsert = vi.fn();
  const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
  const mockUpdate = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    eq: mockEq,
    update: mockUpdate
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
    mockInsert,
    mockEq,
    mockUpdate,
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

import handler from '~/server/api/payments/refund-escrow.post';

const mockEvent = {} as any;

const pendingContract = {
  id: CONTRACT_ID,
  employer_id: EMPLOYER_ID,
  worker_id: '323e4567-e89b-12d3-a456-426614174002',
  status: 'pending'
};

const heldEscrow = {
  id: '523e4567-e89b-12d3-a456-426614174004',
  contract_id: CONTRACT_ID,
  stripe_payment_intent_id: 'pi_mock_xxx',
  total_amount: 115,
  platform_fee: 15,
  worker_payout_amount: 100,
  status: 'held'
};

describe('POST /api/payments/refund-escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUser.mockResolvedValue({ id: EMPLOYER_ID });
    mocks.mockReadBody.mockResolvedValue({ contract_id: CONTRACT_ID });

    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: pendingContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: heldEscrow, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'transactions') {
        return {
          insert: mocks.mockInsert
        };
      }
      return {};
    });
  });

  it('refunds escrow and cancels contract for valid employer', async () => {
    const result = await handler(mockEvent);
    expect(result.success).toBe(true);
    expect(result.contract_id).toBe(CONTRACT_ID);
    expect(result.refund_amount).toBe(115);
    expect(result.escrow_status).toBe('refunded');
    expect(result.contract_status).toBe('cancelled');
  });

  it('rejects unauthenticated requests', async () => {
    mocks.mockUser.mockResolvedValue(null);
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects non-employer trying to refund', async () => {
    mocks.mockUser.mockResolvedValue({ id: 'someone-else' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects invalid contract status', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { ...pendingContract, status: 'completed' }, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects if escrow is not held', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: pendingContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { ...heldEscrow, status: 'released' }, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('handles contract cancellation when escrow does not exist', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: pendingContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) })
        };
      }
      if (table === 'transactions') {
        return {
          insert: mocks.mockInsert
        };
      }
      return {};
    });

    const result = await handler(mockEvent);
    expect(result.success).toBe(true);
    expect(result.refund_amount).toBe(0);
    expect(result.escrow_status).toBe('n/a');
    expect(mocks.mockInsert).not.toHaveBeenCalled();
  });

  it('rejects invalid contract_id format', async () => {
    mocks.mockReadBody.mockResolvedValue({ contract_id: 'not-a-uuid' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates refund transaction when escrow exists', async () => {
    await handler(mockEvent);
    expect(mocks.mockInsert).toHaveBeenCalled();
  });
});
