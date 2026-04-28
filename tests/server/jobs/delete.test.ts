import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DELETE /api/jobs/[id] - Cascade Security Checks', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Contract existence check', () => {
    it('should reject deletion when contracts exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot delete job with existing contracts. Contracts must be completed or cancelled first.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-with-contracts', {
          method: 'DELETE'
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow deletion when no contracts exist', async () => {
      const response = { success: true };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-no-contracts', {
        method: 'DELETE'
      });

      expect(result).toEqual(response);
    });
  });

  describe('Application existence check', () => {
    it('should reject deletion when active applications exist', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot delete job with 2 active application(s). Applications must be withdrawn or the job must be closed first.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-with-applications', {
          method: 'DELETE'
        })
      ).rejects.toMatchObject(error);
    });

    it('should reject deletion when single active application exists', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'Cannot delete job with 1 active application(s). Applications must be withdrawn or the job must be closed first.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/job-with-one-application', {
          method: 'DELETE'
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow deletion when all applications are withdrawn', async () => {
      const response = { success: true };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-withdrawn-applications', {
        method: 'DELETE'
      });

      expect(result).toEqual(response);
    });

    it('should allow deletion when no applications exist', async () => {
      const response = { success: true };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/job-no-applications', {
        method: 'DELETE'
      });

      expect(result).toEqual(response);
    });
  });

  describe('Authorization check', () => {
    it('should reject deletion by non-owner', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'You can only delete your own jobs'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/other-users-job', {
          method: 'DELETE'
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow deletion by job owner', async () => {
      const response = { success: true };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs/my-job', {
        method: 'DELETE'
      });

      expect(result).toEqual(response);
    });
  });

  describe('Error handling', () => {
    it('should return 404 when job not found', async () => {
      const error = {
        statusCode: 404,
        statusMessage: 'Job not found'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs/nonexistent-job', {
          method: 'DELETE'
        })
      ).rejects.toMatchObject(error);
    });
  });
});
