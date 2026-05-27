import { describe, it, expect, beforeAll } from 'vitest';
import { defineEventHandler, createError } from 'h3';

beforeAll(() => {
  (globalThis as any).defineEventHandler = defineEventHandler;
  (globalThis as any).createError = createError;
});

describe('POST /api/payments/webhook', () => {
  it('returns 410 because payment features have been removed', async () => {
    const { default: webhookHandler } = await import('~/server/api/payments/webhook.post');
    try {
      await webhookHandler({} as any);
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.statusCode).toBe(410);
      expect(error.statusMessage).toBe('Payment features have been removed');
    }
  });
});
