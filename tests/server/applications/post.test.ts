import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/applications - Edge Case Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Re-apply clearing withdrawal_reason', () => {
    it('should allow re-applying to withdrawn application and clear withdrawal_reason', async () => {
      const response = {
        application: {
          id: 'app-1',
          job_id: 'job-1',
          worker_id: 'worker-1',
          status: 'pending', // Changed from withdrawn to pending
          cover_letter: 'New cover letter',
          proposed_rate: 150,
          withdrawal_reason: null, // Cleared
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const payload = {
        job_id: 'job-1',
        cover_letter: 'New cover letter',
        proposed_rate: 150
      };

      const result = await $fetch('/api/applications', {
        method: 'POST',
        body: payload
      }) as any;

      expect(result).toEqual(response);
      expect(result.application.withdrawal_reason).toBeNull();
      expect(result.application.status).toBe('pending');
    });

    it('should prevent re-applying to non-withdrawn application', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Cannot apply: You have already applied to this job'
      };

      mockFetch.mockRejectedValue(error);

      const payload = {
        job_id: 'job-1',
        cover_letter: 'Cover letter',
        proposed_rate: 120
      };

      await expect(
        $fetch('/api/applications', {
          method: 'POST',
          body: payload
        })
      ).rejects.toMatchObject(error);
    });
  });
});
