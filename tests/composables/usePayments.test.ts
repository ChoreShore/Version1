import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePayments } from '~/composables/usePayments';
import type {
  PaymentConfirmationResponseInput,
  PaymentIntentResponseInput,
  PaymentsListResponseInput,
  PayoutResponseInput
} from '~/schemas/payment';

const paymentsComposable = usePayments();
const mockFetch = vi.fn();

describe('usePayments composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listEvents fetches role-filtered payment events', async () => {
    const response: PaymentsListResponseInput = { events: [] };
    mockFetch.mockResolvedValue(response);

    const result = await paymentsComposable.listEvents('worker');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments', {
      params: { role: 'worker' }
    });
  });

  it('createIntent posts application payload', async () => {
    const response: PaymentIntentResponseInput = {
      success: true,
      payment_intent_id: 'pi_mock_1',
      client_secret: 'pi_mock_1_secret_mock',
      amount: 230,
      platform_fee: 30,
      payout_amount: 200,
      status: 'pending',
      occurred_at: '2026-04-27T10:00:00.000Z'
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      application_id: '11111111-1111-4111-8111-111111111111',
      idempotency_key: 'idem-key'
    };

    const result = await paymentsComposable.createIntent(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/create-intent', {
      method: 'POST',
      body: payload
    });
  });

  it('confirmPayment posts confirmation payload', async () => {
    const response: PaymentConfirmationResponseInput = {
      success: true,
      status: 'processed',
      payment_intent_id: 'pi_mock_1',
      occurred_at: '2026-04-27T10:01:00.000Z'
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      application_id: '11111111-1111-4111-8111-111111111111',
      payment_intent_id: 'pi_mock_1'
    };

    const result = await paymentsComposable.confirmPayment(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/confirm', {
      method: 'POST',
      body: payload
    });
  });

  it('processPayout posts payout payload', async () => {
    const response: PayoutResponseInput = {
      success: true,
      payout_amount: 200,
      status: 'processed',
      occurred_at: '2026-04-27T10:02:00.000Z'
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      contract_id: '22222222-2222-4222-8222-222222222222',
      idempotency_key: 'payout-1'
    };

    const result = await paymentsComposable.processPayout(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/payout', {
      method: 'POST',
      body: payload
    });
  });
});
