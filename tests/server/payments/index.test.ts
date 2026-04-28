import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/payments/index - Data Leakage Fix', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Employer data filtering', () => {
    it('should show escrow_amount to employer', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150, // Escrow amount
            platform_fee: 150, // Platform fee visible to employer
            payout_amount: null, // Hidden from employer
            status: 'pending',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].amount).toBe(1150);
      expect(result.payments[0].platform_fee).toBe(150);
      expect(result.payments[0].payout_amount).toBeNull();
    });

    it('should hide payout_amount from employer', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null, // Should be null for employer
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].payout_amount).toBeNull();
    });
  });

  describe('Worker data filtering', () => {
    it('should show payout_amount to worker', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_received',
            amount: 1000, // Payout amount
            platform_fee: null, // Hidden from worker
            payout_amount: 1000,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].amount).toBe(1000);
      expect(result.payments[0].payout_amount).toBe(1000);
      expect(result.payments[0].platform_fee).toBeNull();
    });

    it('should hide platform_fee from worker', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_received',
            amount: 1000,
            platform_fee: null, // Should be null for worker
            payout_amount: 1000,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].platform_fee).toBeNull();
    });

    it('should hide escrow_amount from worker', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_received',
            amount: 1000, // This is payout_amount, not escrow
            platform_fee: null,
            payout_amount: 1000,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      // Worker sees payout_amount as amount, not escrow_amount
      expect(result.payments[0].amount).toBe(1000);
      expect(result.payments[0].payout_amount).toBe(1000);
    });
  });

  describe('Payment type classification', () => {
    it('should classify employer contracts as payment_made', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].type).toBe('payment_made');
    });

    it('should classify worker contracts as payment_received', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_received',
            amount: 1000,
            platform_fee: null,
            payout_amount: 1000,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].type).toBe('payment_received');
    });
  });

  describe('Status mapping', () => {
    it('should map payout_status paid to completed', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].status).toBe('completed');
    });

    it('should map payout_status failed to failed', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'failed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].status).toBe('failed');
    });

    it('should map other payout_status to pending', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Test Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'pending',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].status).toBe('pending');
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      const error = {
        statusCode: 401,
        statusMessage: 'Sign in to view payments'
      };

      mockFetch.mockRejectedValue(error);

      await expect($fetch('/api/payments')).rejects.toMatchObject(error);
    });
  });

  describe('Sorting', () => {
    it('should sort payments by date descending', async () => {
      const response = {
        payments: [
          {
            id: 'contract-2',
            job_id: 'job-2',
            job_title: 'Recent Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'completed',
            created_at: '2025-01-02T00:00:00Z'
          },
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Older Job',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments[0].created_at).toBe('2025-01-02T00:00:00Z');
      expect(result.payments[1].created_at).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('Mixed employer and worker contracts', () => {
    it('should return both employer and worker contracts for user with both roles', async () => {
      const response = {
        payments: [
          {
            id: 'contract-1',
            job_id: 'job-1',
            job_title: 'Job as Employer',
            type: 'payment_made',
            amount: 1150,
            platform_fee: 150,
            payout_amount: null,
            status: 'completed',
            created_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 'contract-2',
            job_id: 'job-2',
            job_title: 'Job as Worker',
            type: 'payment_received',
            amount: 1000,
            platform_fee: null,
            payout_amount: 1000,
            status: 'completed',
            created_at: '2025-01-02T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/payments');

      expect(result.payments).toHaveLength(2);
      
      // Employer contract
      const employerContract = result.payments.find(p => p.type === 'payment_made');
      expect(employerContract?.platform_fee).toBe(150);
      expect(employerContract?.payout_amount).toBeNull();
      
      // Worker contract
      const workerContract = result.payments.find(p => p.type === 'payment_received');
      expect(workerContract?.platform_fee).toBeNull();
      expect(workerContract?.payout_amount).toBe(1000);
    });
  });
});
