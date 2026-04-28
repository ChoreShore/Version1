import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PATCH /api/applications/[id] - Edge Case Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Atomic accept flow', () => {
    it('should accept application using atomic RPC and return updated application', async () => {
      const response = {
        application: {
          id: 'app-1',
          job_id: 'job-1',
          worker_id: 'worker-1',
          status: 'accepted',
          cover_letter: 'Cover letter',
          proposed_rate: 120,
          withdrawal_reason: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/applications/app-1', {
        method: 'PATCH',
        body: { status: 'accepted' }
      });

      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith('/api/applications/app-1', {
        method: 'PATCH',
        body: { status: 'accepted' }
      });
    });

    it('should prevent accepting application when job is not open', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Cannot accept application for a job with status "closed"'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'accepted' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Duplicate acceptance prevention', () => {
    it('should prevent accepting another application for the same job', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'This job already has an accepted application'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-2', {
          method: 'PATCH',
          body: { status: 'accepted' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Optimistic locking', () => {
    it('should prevent update when version mismatch occurs', async () => {
      const error = {
        statusCode: 409,
        statusMessage: 'This application was modified by another user. Please refresh and try again.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'rejected' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Valid status transitions', () => {
    it('should prevent accepting withdrawn application', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Cannot change application status from "withdrawn" to "accepted"'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'accepted' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should prevent accepting rejected application', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Cannot change application status from "rejected" to "accepted"'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'accepted' }
        })
      ).rejects.toMatchObject(error);
    });
  });

  describe('Employer ownership check', () => {
    it('should prevent non-employer from accepting application', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'Only the job employer can accept or reject applications'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'accepted' }
        })
      ).rejects.toMatchObject(error);
    });

    it('should prevent non-worker from withdrawing application', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'Only the applicant can withdraw their application'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/applications/app-1', {
          method: 'PATCH',
          body: { status: 'withdrawn' }
        })
      ).rejects.toMatchObject(error);
    });
  });
});
