import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineEventHandler, createError, readBody, getRequestHeader, getRequestURL } from 'h3';
import { createSupabaseMock } from '../../mocks/createSupabaseMock';

(globalThis as any).defineEventHandler = defineEventHandler;
(globalThis as any).createError = createError;
(globalThis as any).readBody = readBody;
(globalThis as any).getRequestHeader = getRequestHeader;
(globalThis as any).getRequestURL = getRequestURL;
(globalThis as any).getRequestIP = vi.fn(() => '127.0.0.1');

const mockServerSupabaseClient = vi.fn();
const mockServerSupabaseUser: any = vi.fn();

vi.mock('#supabase/server', () => ({
  serverSupabaseClient: mockServerSupabaseClient,
  serverSupabaseUser: mockServerSupabaseUser,
}));

const createEvent = (overrides: any = {}) => ({
  body: {},
  headers: {},
  method: 'POST',
  context: { user: { id: 'user-1' }, params: {} },
  query: {},
  ...overrides,
});

describe('Payments Connect Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockServerSupabaseUser.mockResolvedValue({ id: 'user-1', email: 'test@example.com' });
  });

  describe('POST /api/payments/methods/connect', () => {
    let handler: any;

    beforeEach(async () => {
      const { default: imported } = await import('~/server/api/payments/methods/connect.post');
      handler = imported;
    });

    it('connects payment method successfully', async () => {
      const method = {
        id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567890',
        user_id: 'a1b2c3d4-e5f6-4aaa-abcd-ef1234567891',
        role: 'employer',
        method_type: 'card',
        provider: 'stripe_mock',
        connection_status: 'connected',
        verification_status: 'pending',
        brand: 'visa',
        last4: '4242',
        display_label: 'Visa ending in 4242',
        connected_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const mockClient = createSupabaseMock({
        from: {
          payment_methods: { insertSingle: method },
        },
      });
      mockServerSupabaseClient.mockResolvedValue(mockClient);

      const result = await handler(createEvent({
        body: { role: 'employer', method_type: 'card', brand: 'visa', last4: '4242', display_label: 'Visa ending in 4242' },
      }));
      expect(result.success).toBe(true);
      expect(result.method.id).toBe('a1b2c3d4-e5f6-4aaa-abcd-ef1234567890');
      expect(result.method.connection_status).toBe('connected');
    });

    it('throws 400 on validation failure', async () => {
      try {
        await handler(createEvent({ body: {} }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.statusMessage).toBe('Validation failed');
      }
    });

    it('throws 401 when not authenticated', async () => {
      mockServerSupabaseUser.mockResolvedValue(null);

      try {
        await handler(createEvent({
          body: { role: 'employer', method_type: 'card' },
        }));
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(401);
      }
    });
  });
});
