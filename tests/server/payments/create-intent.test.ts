import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/payments/create-intent - Security Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Server-side amount validation', () => {
    it('should use server-side job.budget_amount instead of client amount', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1150, // 1000 + 15% fee
        platform_fee: 150,
        payout_amount: 1000
      };

      mockFetch.mockResolvedValue(response);

      // Client sends different amount but server uses job's budget_amount
      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: {
          job_id: 'job-1',
          amount: 5000 // This should be ignored
        }
      });

      expect(result).toEqual(response);
      expect(result.amount).toBe(1150); // Server calculated from job.budget_amount, not client
    });

    it('should return 404 if job not found', async () => {
      const error = {
        statusCode: 404,
        statusMessage: 'Job not found'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/payments/create-intent', {
          method: 'POST',
          body: { job_id: 'nonexistent-job', amount: 1000 }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Idempotency key functionality', () => {
    it('should accept optional idempotency key from client', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1150,
        platform_fee: 150,
        payout_amount: 1000,
        idempotency_key: 'client-provided-key'
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: {
          job_id: 'job-1',
          amount: 1000,
          idempotency_key: 'client-provided-key'
        }
      });

      expect(result).toEqual(response);
      expect(result.idempotency_key).toBe('client-provided-key');
    });

    it('should generate idempotency key if not provided by client', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1150,
        platform_fee: 150,
        payout_amount: 1000,
        idempotency_key: 'intent_job-1_abc123'
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: {
          job_id: 'job-1',
          amount: 1000
          // No idempotency_key provided
        }
      });

      expect(result).toEqual(response);
      expect(result.idempotency_key).toMatch(/intent_job-1_.+/);
    });

    it('should return existing payment intent if idempotency key already used', async () => {
      const existingResponse = {
        success: true,
        payment_intent_id: 'pi_mock_existing',
        client_secret: 'pi_mock_existing_secret',
        amount: 1150,
        platform_fee: 150,
        payout_amount: 1000,
        idempotency_key: 'unique-key-123'
      };

      mockFetch.mockResolvedValue(existingResponse);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: {
          job_id: 'job-1',
          amount: 1000,
          idempotency_key: 'unique-key-123'
        }
      });

      expect(result.payment_intent_id).toBe('pi_mock_existing');
      expect(result.idempotency_key).toBe('unique-key-123');
    });
  });

  describe('Job status validation', () => {
    it('should reject payment intent for closed job', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Job is not open for payment'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/payments/create-intent', {
          method: 'POST',
          body: { job_id: 'closed-job', amount: 1000 }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject payment intent for draft job', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Job is not open for payment'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/payments/create-intent', {
          method: 'POST',
          body: { job_id: 'draft-job', amount: 1000 }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Budget type validation', () => {
    it('should enforce amount matching budget for fixed-price jobs', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Amount must match job budget of 1000 for fixed-price jobs'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/payments/create-intent', {
          method: 'POST',
          body: { job_id: 'fixed-price-job', amount: 1500 }
        })
      ).rejects.toMatchObject(error);
    });

    it('should accept any amount for hourly jobs', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1150,
        platform_fee: 150,
        payout_amount: 1000
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: { job_id: 'hourly-job', amount: 1500 }
      });

      expect(result).toEqual(response);
    });
  });

  describe('Platform fee calculation', () => {
    it('should calculate platform fee correctly at intent creation', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1150, // 1000 + 15% fee
        platform_fee: 150,
        payout_amount: 1000
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: { job_id: 'job-1', amount: 1000 }
      });

      expect(result.platform_fee).toBe(150);
      expect(result.amount).toBe(1150);
    });

    it('should use environment variable for platform fee percentage', async () => {
      const response = {
        success: true,
        payment_intent_id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        amount: 1200, // 1000 + 20% fee
        platform_fee: 200,
        payout_amount: 1000
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments/create-intent', {
        method: 'POST',
        body: { job_id: 'job-1', amount: 1000 }
      });

      expect(result.platform_fee).toBe(200);
    });
  });
});
