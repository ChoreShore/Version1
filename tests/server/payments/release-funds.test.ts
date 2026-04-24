import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONTRACT_ID = '123e4567-e89b-12d3-a456-426614174000';
const EMPLOYER_ID = '223e4567-e89b-12d3-a456-426614174001';
const WORKER_ID = '323e4567-e89b-12d3-a456-426614174002';

const mocks = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
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

import handler from '~/server/api/payments/release-funds.post';

const mockEvent = {} as any;

const activeContract = {
  id: CONTRACT_ID,
  employer_id: EMPLOYER_ID,
  worker_id: WORKER_ID,
  job_id: '423e4567-e89b-12d3-a456-426614174003',
  status: 'active'
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

describe('POST /api/payments/release-funds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUser.mockResolvedValue({ id: EMPLOYER_ID });
    mocks.mockReadBody.mockResolvedValue({ contract_id: CONTRACT_ID });

    mocks.mockSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    mocks.mockMaybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));

    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: activeContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: heldEscrow, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'transactions') {
        return {
          insert: mocks.mockInsert
        };
      }
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) };
    });
  });

  it('releases funds and completes contract for valid employer', async () => {
    const result = await handler(mockEvent);
    expect(result).toHaveProperty('success', true);
    expect(result.contract_id).toBe(CONTRACT_ID);
    expect(result.payout_amount).toBe(100);
    expect(result.escrow_status).toBe('released');
    expect(result.contract_status).toBe('completed');
  });

  it('rejects unauthenticated requests', async () => {
    mocks.mockUser.mockResolvedValue(null);
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects non-employer trying to release funds', async () => {
    mocks.mockUser.mockResolvedValue({ id: 'someone-else' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects if contract is not active', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { ...activeContract, status: 'pending' }, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects if escrow payment not found', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: activeContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }) }) })
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects if escrow is not held', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        return {
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: activeContract, error: null }) }) }),
          update: mocks.mockUpdate
        };
      }
      if (table === 'escrow_payments') {
        const releasedEscrow = { ...heldEscrow, status: 'released' };
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: releasedEscrow, error: null })
            })
          }),
          update: mocks.mockUpdate
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

  it('creates transaction for worker payout', async () => {
    await handler(mockEvent);
    expect(mocks.mockInsert).toHaveBeenCalled();
  });
});
