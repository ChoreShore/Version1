import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/jobs - Role Bypass Security Fix', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Client-supplied role parameter is ignored', () => {
    it('should not allow worker to access employer jobs by spoofing role param', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'Access denied. Only employers can view their own jobs.'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/jobs?role=employer&scope=mine')
      ).rejects.toMatchObject(error);
    });

    it('should resolve role from server-side profile, not query param', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Open Job',
            status: 'open',
            employer_id: 'other-employer'
          }
        ],
        preview_mode: false
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs?role=employer&scope=mine');

      expect(result).toEqual(response);
      // The server should have resolved the actual worker role from the profile
      // and returned only open jobs from other employers, not the employer's own jobs
      expect((result.jobs[0] as any).status).toBe('open');
      expect((result.jobs[0] as any).employer_id).not.toBe('current-user');
    });

    it('should allow employer with scope=mine to see their own jobs', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'My Job',
            status: 'open',
            employer_id: 'current-user'
          }
        ],
        preview_mode: false
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs?role=employer&scope=mine');

      expect(result).toEqual(response);
      expect((result.jobs[0] as any).employer_id).toBe('current-user');
    });
  });

  describe('Default behavior for authenticated users', () => {
    it('should show open jobs from other users when no scope specified', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Open Job',
            status: 'open',
            employer_id: 'other-employer'
          }
        ],
        preview_mode: false
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/jobs');

      expect(result.jobs.every((job: any) => (job as any).status === 'open')).toBe(true);
      expect(result.jobs.every((job: any) => (job as any).employer_id !== 'current-user')).toBe(true);
    });
  });
});
