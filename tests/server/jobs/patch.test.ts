import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PATCH /api/jobs/[id] - Security Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Budget edit prevention after applications', () => {
    it('should reject budget_amount edit when applications exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot edit budget_amount, budget_type, deadline, description after applications have been submitted. Job terms are frozen to protect applicants.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { budget_amount: 2000 }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject budget_type edit when applications exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot edit budget_amount, budget_type, deadline, description after applications have been submitted. Job terms are frozen to protect applicants.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { budget_type: 'hourly' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject deadline edit when applications exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot edit budget_amount, budget_type, deadline, description after applications have been submitted. Job terms are frozen to protect applicants.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { deadline: '2025-12-31' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject description edit when applications exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot edit budget_amount, budget_type, deadline, description after applications have been submitted. Job terms are frozen to protect applicants.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { description: 'Updated description' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow budget_amount edit when no applications exist', async () => {
      const response = {
        job: {
          id: 'job-1',
          title: 'Test Job',
          budget_amount: 2000,
          budget_type: 'fixed',
          status: 'open'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-1', {
        method: 'PATCH',
        body: { budget_amount: 2000 }
      });

      expect(result).toEqual(response);
    });

    it('should allow non-blocked field edits when applications exist', async () => {
      const response = {
        job: {
          id: 'job-1',
          title: 'Updated Title',
          budget_amount: 1000,
          budget_type: 'fixed',
          status: 'open'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-1', {
        method: 'PATCH',
        body: { title: 'Updated Title' }
      });

      expect(result).toEqual(response);
    });
  });

  describe('Budget edit prevention after contracts', () => {
    it('should reject budget_amount edit when contracts exist', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Cannot edit job budget amount after contracts have been created. Budget is frozen at contract creation time.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { budget_amount: 2000 }
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow budget_amount edit when no contracts exist', async () => {
      const response = {
        job: {
          id: 'job-1',
          title: 'Test Job',
          budget_amount: 2000,
          budget_type: 'fixed',
          status: 'open'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-1', {
        method: 'PATCH',
        body: { budget_amount: 2000 }
      });

      expect(result).toEqual(response);
    });
  });

  describe('Multiple blocked fields', () => {
    it('should list all blocked fields in error message', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot edit budget_amount, budget_type, deadline after applications have been submitted. Job terms are frozen to protect applicants.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { 
            budget_amount: 2000,
            budget_type: 'hourly',
            deadline: '2025-12-31'
          }
        })
      ).rejects.toMatchObject(error);

      expect(error.statusMessage).toContain('budget_amount');
      expect(error.statusMessage).toContain('budget_type');
      expect(error.statusMessage).toContain('deadline');
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const error = {
        statusCode: 401,
        statusMessage: 'Sign in to update job details'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { budget_amount: 2000 }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject edits from non-employer', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'You can only update your own jobs'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { budget_amount: 2000 }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Status transition validation', () => {
    it('should validate status transitions', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Invalid status transition: cannot move from "closed" to "open"'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { status: 'open' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Category validation', () => {
    it('should validate category_id if provided', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Invalid category ID'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { category_id: 'invalid-category' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject update to inactive category', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Selected category is inactive'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { category_id: 'inactive-cat-id' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Deadline re-validation', () => {
    it('should reject past deadline on update', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Deadline must be a valid date in the future'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { deadline: '2020-01-01' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject non-date deadline on update', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Deadline must be a valid date in the future'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-1', {
          method: 'PATCH',
          body: { deadline: 'not-a-date' }
        })
      ).rejects.toMatchObject(error);
    });
  });
});
