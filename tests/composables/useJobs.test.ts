import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJobs } from '~/composables/useJobs';
import type {
  JobsResponseInput,
  JobResponseInput,
  CategoriesResponseInput,
  NearJobsResponseInput
} from '~/schemas/job';

const jobsComposable = useJobs();
const mockFetch = vi.fn();

describe('useJobs composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listJobs calls /api/jobs with query params', async () => {
    const response: JobsResponse = {
      jobs: [],
      preview_mode: false
    };

    mockFetch.mockResolvedValue(response);

    const query = { limit: '5', category: 'cleaning' };
    const result = await jobsComposable.listJobs(query);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs', { params: query });
  });

  it('getJob fetches a single job by id', async () => {
    const response: JobResponse = {
      job: {
        id: 'job-123',
        employer_id: 'employer-1',
        title: 'Test job',
        description: 'Job description',
        category_id: 'cat-1',
        postcode: 'AB1 2CD',
        latitude: null,
        longitude: null,
        budget_type: 'fixed',
        budget_amount: 100,
        deadline: '2026-01-01T00:00:00Z',
        status: 'open',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const result = await jobsComposable.getJob('job-123');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/job-123');
  });

  it('createJob posts payload to /api/jobs', async () => {
    const response: JobResponse = {
      job: {
        id: 'job-123',
        employer_id: 'employer-1',
        title: 'Created job',
        description: 'Job description',
        category_id: 'cat-1',
        postcode: 'AB1 2CD',
        latitude: null,
        longitude: null,
        budget_type: 'fixed',
        budget_amount: 200,
        deadline: '2026-01-01T00:00:00Z',
        status: 'open',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = {
      title: 'Created job',
      description: 'Job description',
      category_id: 'cat-1',
      postcode: 'AB1 2CD',
      budget_type: 'fixed' as const,
      budget_amount: 200,
      deadline: '2026-01-01T00:00:00Z'
    };

    const result = await jobsComposable.createJob(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs', {
      method: 'POST',
      body: payload
    });
  });

  it('updateJob patches payload to specific job', async () => {
    const response: JobResponse = {
      job: {
        id: 'job-123',
        employer_id: 'employer-1',
        title: 'Updated job',
        description: 'Updated description',
        category_id: 'cat-1',
        postcode: 'AB1 2CD',
        latitude: null,
        longitude: null,
        budget_type: 'fixed',
        budget_amount: 300,
        deadline: '2026-01-01T00:00:00Z',
        status: 'open',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = {
      title: 'Updated job',
      budget_amount: 300
    };

    const result = await jobsComposable.updateJob('job-123', payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/job-123', {
      method: 'PATCH',
      body: payload
    });
  });

  it('deleteJob calls DELETE on specific job', async () => {
    const response = { success: true };
    mockFetch.mockResolvedValue(response);

    const result = await jobsComposable.deleteJob('job-123');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/job-123', {
      method: 'DELETE'
    });
  });

  it('listCategories fetches job categories', async () => {
    const response: CategoriesResponse = {
      categories: [
        {
          id: 'cat-1',
          name: 'Cleaning',
          description: null,
          created_at: '2025-01-01T00:00:00Z'
        }
      ]
    };

    mockFetch.mockResolvedValue(response);

    const result = await jobsComposable.listCategories();

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/categories');
  });

  it('findNearbyJobs calls /api/jobs/near with lat/lng/distance params', async () => {
    const response: NearJobsResponse = {
      jobs: [
        {
          job_id: 'job-1',
          title: 'Nearby job',
          distance_km: 2
        }
      ]
    };

    mockFetch.mockResolvedValue(response);

    const result = await jobsComposable.findNearbyJobs(51.5, -0.1, 25);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/jobs/near', {
      params: {
        lat: '51.5',
        lng: '-0.1',
        distance: '25'
      }
    });
  });
});
