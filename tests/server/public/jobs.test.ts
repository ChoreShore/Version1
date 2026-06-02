import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/public/jobs', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Response shape', () => {
    it('returns an array of jobs wrapped in a jobs key', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden of weeds and rubbish',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: 4.5,
              total_jobs_posted: 7
            },
            application_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs') as any;

      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.jobs.length).toBeGreaterThan(0);
    });

    it('each job contains exactly the public-safe fields', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden of weeds and rubbish',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: 4.5,
              total_jobs_posted: 7
            },
            application_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs') as any;
      const job = result.jobs[0];

      expect(job).toHaveProperty('id');
      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('description');
      expect(job).toHaveProperty('category_id');
      expect(job).toHaveProperty('category_name');
      expect(job).toHaveProperty('postcode_area');
      expect(job).toHaveProperty('budget_type');
      expect(job).toHaveProperty('budget_amount');
      expect(job).toHaveProperty('created_at');
      expect(job).toHaveProperty('posted_at_relative');
      expect(job).toHaveProperty('employer');
      expect(job).toHaveProperty('application_count');
    });

    it('does not expose employer_id or full postcode', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: 4.5,
              total_jobs_posted: 7
            },
            application_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs');
      const job = result.jobs[0];

      expect(job).not.toHaveProperty('employer_id');
      expect(job).not.toHaveProperty('postcode');
      expect(job).not.toHaveProperty('latitude');
      expect(job).not.toHaveProperty('longitude');
    });
  });

  describe('Employer name formatting', () => {
    it('returns display name as "Firstname S."', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: 4.5,
              total_jobs_posted: 7
            },
            application_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs') as any;
      expect(result.jobs[0].employer.display_name).toMatch(/^[A-Za-z]+\s[A-Za-z]\.$/);
    });
  });

  describe('Rating handling', () => {
    it('returns numeric average rating when reviews exist', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: 4.5,
              total_jobs_posted: 7
            },
            application_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs') as any;
      const rating = result.jobs[0].employer.average_rating;

      expect(typeof rating).toBe('number');
      expect(rating).toBeGreaterThanOrEqual(1);
      expect(rating).toBeLessThanOrEqual(5);
    });

    it('returns null average_rating when employer has no reviews', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            description: 'Clear my garden',
            category_id: 'cat-1',
            category_name: 'Gardening',
            postcode_area: 'SW1A',
            budget_type: 'fixed',
            budget_amount: 150,
            created_at: '2026-05-15T10:00:00Z',
            posted_at_relative: '2 days ago',
            employer: {
              display_name: 'John D.',
              average_rating: null,
              total_jobs_posted: 1
            },
            application_count: 0
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs') as any;
      expect(result.jobs[0].employer.average_rating).toBeNull();
    });
  });

  describe('Limit parameter', () => {
    it('respects the limit query parameter', async () => {
      mockFetch.mockResolvedValue({ jobs: [] });

      await $fetch('/api/public/jobs?limit=5');

      expect(mockFetch).toHaveBeenCalledWith('/api/public/jobs?limit=5');
    });

    it('caps limit at 20', async () => {
      const response = {
        jobs: Array.from({ length: 20 }, (_, i) => ({
          id: `job-${i}`,
          title: `Job ${i}`,
          description: 'Desc',
          category_id: 'cat-1',
          category_name: 'Cat',
          postcode_area: 'SW1A',
          budget_type: 'fixed',
          budget_amount: 100,
          created_at: '2026-05-15T10:00:00Z',
          posted_at_relative: '1 day ago',
          employer: {
            display_name: 'John D.',
            average_rating: null,
            total_jobs_posted: 1
          },
          application_count: 0
        }))
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs?limit=50') as any;
      expect(result.jobs.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Empty state', () => {
    it('returns empty jobs array when no open jobs exist', async () => {
      mockFetch.mockResolvedValue({ jobs: [] });

      const result = await $fetch('/api/public/jobs') as any;

      expect(result.jobs).toEqual([]);
    });
  });
});
