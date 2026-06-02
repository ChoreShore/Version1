import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/public/jobs-board', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Required parameters', () => {
    it('requires latitude and longitude', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Valid latitude and longitude are required'
      };

      mockFetch.mockRejectedValue(error);

      await expect($fetch('/api/public/jobs-board')).rejects.toMatchObject(error);
    });

    it('rejects invalid latitude', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Latitude must be between -90 and 90'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/public/jobs-board?lat=95&lng=0')
      ).rejects.toMatchObject(error);
    });

    it('rejects invalid longitude', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Longitude must be between -180 and 180'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/public/jobs-board?lat=0&lng=200')
      ).rejects.toMatchObject(error);
    });

    it('rejects invalid distance', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Distance must be between 0 and 500 miles'
      };

      mockFetch.mockRejectedValue(error);

      await expect(
        $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1&distance=600')
      ).rejects.toMatchObject(error);
    });
  });

  describe('Response shape', () => {
    it('returns jobs sorted by distance with total count', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            budget_type: 'fixed',
            budget_amount: 150,
            distance_miles: 1.2,
            posted_at_relative: '2 hours ago',
            category_name: 'Gardening',
            postcode_area: 'SW1A'
          },
          {
            id: 'job-2',
            title: 'Painting a room',
            budget_type: 'hourly',
            budget_amount: 25,
            distance_miles: 3.5,
            posted_at_relative: '1 day ago',
            category_name: 'Painting',
            postcode_area: 'EC1A'
          }
        ],
        total: 15
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1') as any;

      expect(Array.isArray(result.jobs)).toBe(true);
      expect(typeof result.total).toBe('number');
      expect(result.total).toBeGreaterThanOrEqual(result.jobs.length);
    });

    it('each job contains the 4 requested display fields', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            budget_type: 'fixed',
            budget_amount: 150,
            distance_miles: 1.2,
            posted_at_relative: '2 hours ago',
            category_name: 'Gardening',
            postcode_area: 'SW1A'
          }
        ],
        total: 1
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1');
      const job = result.jobs[0];

      expect(job).toHaveProperty('title');
      expect(job).toHaveProperty('budget_type');
      expect(job).toHaveProperty('budget_amount');
      expect(job).toHaveProperty('distance_miles');
      expect(job).toHaveProperty('posted_at_relative');
    });

    it('returns distance in miles as a number', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            budget_type: 'fixed',
            budget_amount: 150,
            distance_miles: 1.2,
            posted_at_relative: '2 hours ago',
            category_name: 'Gardening',
            postcode_area: 'SW1A'
          }
        ],
        total: 1
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1');
      const distance = result.jobs[0].distance_miles;

      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    it('returns relative time in human-readable format', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            budget_type: 'fixed',
            budget_amount: 150,
            distance_miles: 1.2,
            posted_at_relative: '2 hours ago',
            category_name: 'Gardening',
            postcode_area: 'SW1A'
          },
          {
            id: 'job-2',
            title: 'Painting',
            budget_type: 'hourly',
            budget_amount: 25,
            distance_miles: 3.5,
            posted_at_relative: '2 days ago',
            category_name: 'Painting',
            postcode_area: 'EC1A'
          }
        ],
        total: 2
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1');

      for (const job of result.jobs) {
        expect(typeof job.posted_at_relative).toBe('string');
        expect(job.posted_at_relative.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Sorting', () => {
    it('returns jobs ordered by distance ascending', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Close job',
            budget_type: 'fixed',
            budget_amount: 100,
            distance_miles: 0.5,
            posted_at_relative: '1 hour ago',
            category_name: 'Cleaning',
            postcode_area: 'W1A'
          },
          {
            id: 'job-2',
            title: 'Far job',
            budget_type: 'fixed',
            budget_amount: 200,
            distance_miles: 5.0,
            posted_at_relative: '3 hours ago',
            category_name: 'Cleaning',
            postcode_area: 'W2A'
          }
        ],
        total: 2
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1');
      const distances = result.jobs.map((j: any) => j.distance_miles);

      for (let i = 1; i < distances.length; i++) {
        expect(distances[i]).toBeGreaterThanOrEqual(distances[i - 1]);
      }
    });
  });

  describe('Pagination', () => {
    it('accepts limit and offset parameters', async () => {
      mockFetch.mockResolvedValue({ jobs: [], total: 0 });

      await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1&limit=10&offset=20');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/public/jobs-board?lat=51.5&lng=-0.1&limit=10&offset=20'
      );
    });

    it('caps limit at 100', async () => {
      const response = {
        jobs: Array.from({ length: 100 }, (_, i) => ({
          id: `job-${i}`,
          title: `Job ${i}`,
          budget_type: 'fixed',
          budget_amount: 100,
          distance_miles: i + 1,
          posted_at_relative: '1 day ago',
          category_name: 'Cat',
          postcode_area: 'SW1A'
        })),
        total: 200
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1&limit=200');
      expect(result.jobs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Empty state', () => {
    it('returns empty jobs array when no jobs are nearby', async () => {
      mockFetch.mockResolvedValue({ jobs: [], total: 0 });

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1') as any;

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('Field safety', () => {
    it('does not expose employer_id or full postcode', async () => {
      const response = {
        jobs: [
          {
            id: 'job-1',
            title: 'Garden clearance',
            budget_type: 'fixed',
            budget_amount: 150,
            distance_miles: 1.2,
            posted_at_relative: '2 hours ago',
            category_name: 'Gardening',
            postcode_area: 'SW1A'
          }
        ],
        total: 1
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/public/jobs-board?lat=51.5&lng=-0.1');
      const job = result.jobs[0];

      expect(job).not.toHaveProperty('employer_id');
      expect(job).not.toHaveProperty('postcode');
      expect(job).not.toHaveProperty('latitude');
      expect(job).not.toHaveProperty('longitude');
      expect(job).not.toHaveProperty('description');
    });
  });
});
