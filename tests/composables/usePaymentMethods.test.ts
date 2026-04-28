import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePaymentMethods } from '~/composables/usePaymentMethods';
import type { PaymentMethodMutationResponseInput, PaymentMethodsResponseInput } from '~/schemas/payment';

const paymentMethodsComposable = usePaymentMethods();
const mockFetch = vi.fn();

const method = {
  id: '33333333-3333-4333-8333-333333333333',
  user_id: '44444444-4444-4444-8444-444444444444',
  role: 'employer' as const,
  method_type: 'card' as const,
  provider: 'stripe_mock',
  connection_status: 'connected' as const,
  verification_status: 'pending' as const,
  brand: 'Visa',
  last4: '4242',
  display_label: 'Visa ending 4242',
  connected_at: '2026-04-27T10:00:00.000Z',
  verified_at: null,
  updated_at: '2026-04-27T10:00:00.000Z'
};

describe('usePaymentMethods composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listMethods fetches payment methods', async () => {
    const response: PaymentMethodsResponseInput = { methods: [method] };
    mockFetch.mockResolvedValue(response);

    const result = await paymentMethodsComposable.listMethods();

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/methods');
  });

  it('connectMethod posts connect payload', async () => {
    const response: PaymentMethodMutationResponseInput = {
      success: true,
      method
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      role: 'employer' as const,
      method_type: 'card' as const,
      brand: 'Visa',
      last4: '4242',
      display_label: 'Visa ending 4242'
    };

    const result = await paymentMethodsComposable.connectMethod(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/methods/connect', {
      method: 'POST',
      body: payload
    });
  });

  it('verifyMethod posts verify payload', async () => {
    const response: PaymentMethodMutationResponseInput = {
      success: true,
      method: {
        ...method,
        verification_status: 'verified',
        verified_at: '2026-04-27T10:10:00.000Z'
      }
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      role: 'employer' as const,
      method_type: 'card' as const
    };

    const result = await paymentMethodsComposable.verifyMethod(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/methods/verify', {
      method: 'POST',
      body: payload
    });
  });

  it('disconnectMethod posts disconnect payload', async () => {
    const response: PaymentMethodMutationResponseInput = {
      success: true,
      method: {
        ...method,
        connection_status: 'disconnected',
        verification_status: 'pending'
      }
    };
    mockFetch.mockResolvedValue(response);

    const payload = {
      role: 'employer' as const,
      method_type: 'card' as const
    };

    const result = await paymentMethodsComposable.disconnectMethod(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/payments/methods/disconnect', {
      method: 'POST',
      body: payload
    });
  });
});
