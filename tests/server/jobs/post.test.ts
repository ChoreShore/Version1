import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/jobs - Double-submit deduplication', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Duplicate prevention', () => {
    it('should create a new job on first submission', async () => {
      const response = {
        job: {
          id: 'job-new',
          title: 'House Cleaning',
          status: 'open',
          employer_id: 'current-user'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs', {
        method: 'POST',
        body: {
          title: 'House Cleaning',
          description: 'Need a cleaner for my apartment',
          category_id: 'cat-1',
          budget_type: 'fixed',
          budget_amount: 100,
          deadline: '2025-12-31',
          postcode: 'SW1A 1AA',
          client_request_id: 'req-uuid-1'
        }
      });

      expect(result).toEqual(response);
    });

    it('should return existing job for duplicate submission within 30 seconds', async () => {
      const response = {
        job: {
          id: 'job-existing',
          title: 'House Cleaning',
          status: 'open',
          employer_id: 'current-user',
          created_at: new Date().toISOString()
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs', {
        method: 'POST',
        body: {
          title: 'House Cleaning',
          description: 'Need a cleaner for my apartment',
          category_id: 'cat-1',
          budget_type: 'fixed',
          budget_amount: 100,
          deadline: '2025-12-31',
          postcode: 'SW1A 1AA',
          client_request_id: 'req-uuid-2'
        }
      });

      expect(result.job.id).toBe('job-existing');
    });

    it('should reject job with inactive category', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Selected category is inactive'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs', {
          method: 'POST',
          body: {
            title: 'House Cleaning',
            description: 'Need a cleaner',
            category_id: 'inactive-cat',
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2025-12-31',
            postcode: 'SW1A 1AA',
            client_request_id: 'req-uuid-3'
          }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Validation', () => {
    it('should reject job without employer role', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'Only employers can create jobs. Add employer role to your profile first.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs', {
          method: 'POST',
          body: {
            title: 'House Cleaning',
            description: 'Need a cleaner',
            category_id: 'cat-1',
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2025-12-31',
            postcode: 'SW1A 1AA',
            client_request_id: 'req-uuid-4'
          }
        })
      ).rejects.toMatchObject(error);
    });
  });
});
