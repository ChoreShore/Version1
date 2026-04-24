import { describe, it, expect, vi } from 'vitest';
import { mockStripe } from '~/server/utils/stripe';

describe('mockStripe utility', () => {
  describe('createPaymentIntent', () => {
    it('creates a payment intent with correct structure', () => {
      const result = mockStripe.createPaymentIntent(100, 15, 85);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('amount', 100);
      expect(result).toHaveProperty('currency', 'gbp');
      expect(result).toHaveProperty('status', 'requires_confirmation');
      expect(result).toHaveProperty('platform_fee', 15);
      expect(result).toHaveProperty('worker_payout', 85);
    });

    it('generates unique IDs for each payment intent', () => {
      const id1 = mockStripe.createPaymentIntent(100, 15, 85).id;
      const id2 = mockStripe.createPaymentIntent(100, 15, 85).id;
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with correct prefix', () => {
      const result = mockStripe.createPaymentIntent(100, 15, 85);
      expect(result.id).toMatch(/^pi_mock_/);
    });

    it('handles zero amounts', () => {
      const result = mockStripe.createPaymentIntent(0, 0, 0);
      expect(result.amount).toBe(0);
      expect(result.platform_fee).toBe(0);
      expect(result.worker_payout).toBe(0);
    });

    it('handles decimal amounts', () => {
      const result = mockStripe.createPaymentIntent(99.99, 14.99, 85);
      expect(result.amount).toBe(99.99);
      expect(result.platform_fee).toBe(14.99);
      expect(result.worker_payout).toBe(85);
    });
  });

  describe('confirmPaymentIntent', () => {
    it('returns succeeded status with correct structure', () => {
      const result = mockStripe.confirmPaymentIntent('pi_mock_123');
      expect(result).toHaveProperty('id', 'pi_mock_123');
      expect(result).toHaveProperty('status', 'succeeded');
      expect(result).toHaveProperty('currency', 'gbp');
    });

    it('returns zero amounts after confirmation', () => {
      const result = mockStripe.confirmPaymentIntent('pi_mock_123');
      expect(result.amount).toBe(0);
      expect(result.platform_fee).toBe(0);
      expect(result.worker_payout).toBe(0);
    });

    it('preserves the provided payment intent ID', () => {
      const customId = 'pi_custom_abc456';
      const result = mockStripe.confirmPaymentIntent(customId);
      expect(result.id).toBe(customId);
    });
  });

  describe('refundPaymentIntent', () => {
    it('returns refunded status with correct structure', () => {
      const result = mockStripe.refundPaymentIntent('pi_mock_789');
      expect(result).toHaveProperty('id', 'pi_mock_789');
      expect(result).toHaveProperty('status', 'refunded');
      expect(result).toHaveProperty('currency', 'gbp');
    });

    it('returns zero amounts after refund', () => {
      const result = mockStripe.refundPaymentIntent('pi_mock_789');
      expect(result.amount).toBe(0);
      expect(result.platform_fee).toBe(0);
      expect(result.worker_payout).toBe(0);
    });

    it('preserves the provided payment intent ID', () => {
      const customId = 'pi_custom_xyz999';
      const result = mockStripe.refundPaymentIntent(customId);
      expect(result.id).toBe(customId);
    });
  });

  describe('generateTransactionId', () => {
    it('generates unique transaction IDs', () => {
      const id1 = mockStripe.generateTransactionId();
      const id2 = mockStripe.generateTransactionId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with correct prefix', () => {
      const result = mockStripe.generateTransactionId();
      expect(result).toMatch(/^txn_mock_/);
    });

    it('generates valid UUID-like IDs (without hyphens)', () => {
      const result = mockStripe.generateTransactionId();
      const idPart = result.replace('txn_mock_', '');
      expect(idPart).toMatch(/^[a-f0-9]+$/);
      expect(idPart.length).toBeGreaterThan(0);
    });

    it('generates different IDs on multiple calls', () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(mockStripe.generateTransactionId());
      }
      expect(ids.size).toBe(10);
    });
  });

  describe('integration: full payment flow', () => {
    it('supports create -> confirm -> release flow', () => {
      const paymentIntent = mockStripe.createPaymentIntent(100, 15, 85);
      expect(paymentIntent.status).toBe('requires_confirmation');

      const confirmed = mockStripe.confirmPaymentIntent(paymentIntent.id);
      expect(confirmed.status).toBe('succeeded');
      expect(confirmed.id).toBe(paymentIntent.id);
    });

    it('supports create -> refund flow', () => {
      const paymentIntent = mockStripe.createPaymentIntent(100, 15, 85);
      expect(paymentIntent.status).toBe('requires_confirmation');

      const refunded = mockStripe.refundPaymentIntent(paymentIntent.id);
      expect(refunded.status).toBe('refunded');
      expect(refunded.id).toBe(paymentIntent.id);
    });

    it('generates transaction IDs for each operation', () => {
      const txn1 = mockStripe.generateTransactionId();
      const txn2 = mockStripe.generateTransactionId();
      const txn3 = mockStripe.generateTransactionId();
      
      expect(txn1).not.toBe(txn2);
      expect(txn2).not.toBe(txn3);
      expect(txn1).not.toBe(txn3);
      
      expect(txn1).toMatch(/^txn_mock_/);
      expect(txn2).toMatch(/^txn_mock_/);
      expect(txn3).toMatch(/^txn_mock_/);
    });
  });
});
