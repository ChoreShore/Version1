import { describe, it, expect, vi, beforeEach } from 'vitest';

const CONTRACT_ID = '123e4567-e89b-12d3-a456-426614174000';
const EMPLOYER_ID = '223e4567-e89b-12d3-a456-426614174001';
const PAYMENT_INTENT_ID = 'pi_mock_abc123';

const mocks = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn();
  const mockEq = vi.fn(() => ({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle }));
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
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

import handler from '~/server/api/payments/confirm-escrow.post';

const mockEvent = {} as any;

const validContract = {
  id: CONTRACT_ID,
  employer_id: EMPLOYER_ID,
  worker_id: '323e4567-e89b-12d3-a456-426614174002',
  job_id: '423e4567-e89b-12d3-a456-426614174003',
  status: 'pending'
};

const validEscrow = {
  id: '523e4567-e89b-12d3-a456-426614174004',
  contract_id: CONTRACT_ID,
  stripe_payment_intent_id: PAYMENT_INTENT_ID,
  total_amount: 115,
  platform_fee: 15,
  worker_payout_amount: 100,
  status: 'held'
};

describe('POST /api/payments/confirm-escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUser.mockResolvedValue({ id: EMPLOYER_ID });
    mocks.mockReadBody.mockResolvedValue({ contract_id: CONTRACT_ID, payment_intent_id: PAYMENT_INTENT_ID });

    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        const chainableEq = vi.fn(() => ({
          eq: vi.fn(() => ({ single: () => Promise.resolve({ data: validContract, error: null }) })),
          single: () => Promise.resolve({ data: validContract, error: null })
        }));
        return {
          select: () => ({ eq: chainableEq }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) })
        };
      }
      if (table === 'escrow_payments') {
        const chainableEq = vi.fn(() => ({
          eq: vi.fn(() => ({ single: () => Promise.resolve({ data: validEscrow, error: null }) })),
          single: () => Promise.resolve({ data: validEscrow, error: null })
        }));
        return {
          select: () => ({ eq: chainableEq })
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

  it('confirms payment and activates contract for valid employer', async () => {
    const result = await handler(mockEvent);
    expect(result).toHaveProperty('success', true);
    expect(result.contract_id).toBe(CONTRACT_ID);
    expect(result.escrow_status).toBe('held');
    expect(result.contract_status).toBe('active');
  });

  it('rejects unauthenticated requests', async () => {
    mocks.mockUser.mockResolvedValue(null);
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects non-employer trying to confirm payment', async () => {
    mocks.mockUser.mockResolvedValue({ id: 'someone-else' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects if contract is already active', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        const chainableEq = vi.fn(() => ({
          eq: vi.fn(() => ({ single: () => Promise.resolve({ data: { ...validContract, status: 'active' }, error: null }) })),
          single: () => Promise.resolve({ data: { ...validContract, status: 'active' }, error: null })
        }));
        return {
          select: () => ({ eq: chainableEq }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) })
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects if escrow payment not found', async () => {
    (mocks.mockFrom as any).mockImplementation((table: string) => {
      if (table === 'contracts') {
        const chainableEq = vi.fn(() => ({
          eq: vi.fn(() => ({ single: () => Promise.resolve({ data: validContract, error: null }) })),
          single: () => Promise.resolve({ data: validContract, error: null })
        }));
        return {
          select: () => ({ eq: chainableEq }),
          update: () => ({ eq: () => Promise.resolve({ error: null }) })
        };
      }
      if (table === 'escrow_payments') {
        const chainableEq = vi.fn(() => ({
          eq: vi.fn(() => ({ single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }) })),
          single: () => Promise.resolve({ data: null, error: { message: 'Not found' } })
        }));
        return {
          select: () => ({ eq: chainableEq })
        };
      }
      return {};
    });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects invalid contract_id format', async () => {
    mocks.mockReadBody.mockResolvedValue({ contract_id: 'not-a-uuid', payment_intent_id: PAYMENT_INTENT_ID });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects missing payment_intent_id', async () => {
    mocks.mockReadBody.mockResolvedValue({ contract_id: CONTRACT_ID, payment_intent_id: '' });
    await expect(handler(mockEvent)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates transactions for deposit and fee', async () => {
    await handler(mockEvent);
    expect(mocks.mockInsert).toHaveBeenCalled();
  });
});
