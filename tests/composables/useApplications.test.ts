import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useApplications } from '~/composables/useApplications';
import type {
  CreateApplicationInput,
  ApplicationsResponseInput,
  ApplicationResponseInput,
  ApplicationStatsResponseInput
} from '~/schemas/application';

const applicationsComposable = useApplications();
const mockFetch = vi.fn();

describe('useApplications composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listMyApplications fetches worker applications', async () => {
    const response: ApplicationsResponseInput = {
      applications: []
    };

    mockFetch.mockResolvedValue(response);

    const result = await applicationsComposable.listMyApplications();

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications', { params: undefined });
  });

  it('getApplication fetches a specific application', async () => {
    const response: ApplicationResponseInput = {
      application: {
        id: 'app-1',
        job_id: 'job-1',
        worker_id: 'worker-1',
        status: 'pending',
        cover_letter: 'Cover letter',
        proposed_rate: 120,
        availability_notes: 'Soon',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const result = await applicationsComposable.getApplication('app-1');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications/app-1');
  });

  it('createApplication posts payload to /api/applications', async () => {
    const response: ApplicationResponseInput = {
      application: {
        id: 'app-1',
        job_id: 'job-1',
        worker_id: 'worker-1',
        status: 'pending',
        cover_letter: 'Cover letter',
        proposed_rate: 120,
        availability_notes: 'Soon',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = {
      job_id: 'job-1',
      cover_letter: 'Cover letter',
      proposed_rate: 120,
      availability_notes: 'Soon'
    };

    const result = await applicationsComposable.createApplication(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications', {
      method: 'POST',
      body: payload
    });
  });

  it('updateApplication patches an application', async () => {
    const response: ApplicationResponseInput = {
      application: {
        id: 'app-1',
        job_id: 'job-1',
        worker_id: 'worker-1',
        status: 'accepted',
        cover_letter: 'Cover letter',
        proposed_rate: 120,
        availability_notes: 'Soon',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = { status: 'accepted' as const };

    const result = await applicationsComposable.updateApplication('app-1', payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications/app-1', {
      method: 'PATCH',
      body: payload
    });
  });

  it('listJobApplications fetches applications for a job', async () => {
    const response: ApplicationsResponseInput = {
      applications: [
        {
          id: 'app-1',
          job_id: 'job-1',
          worker_id: 'worker-1',
          status: 'pending',
          cover_letter: 'Cover letter',
          proposed_rate: 120,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]
    };

    mockFetch.mockResolvedValue(response);

    const result = await applicationsComposable.getJobApplications('job-123');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications/job/job-123');
  });

  it('getJobApplicationStats fetches stats for a job', async () => {
    const response: ApplicationStatsResponseInput = {
      total: 5,
      pending: 3,
      accepted: 1,
      rejected: 1
    };

    mockFetch.mockResolvedValue(response);

    const result = await applicationsComposable.getJobApplicationStats('job-1');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/applications/job/job-1/stats');
  });

  it('updateApplication handles invalid status transition error', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Cannot change application status from "accepted" to "pending"'
    };

    mockFetch.mockRejectedValue(error);

    await expect(
      applicationsComposable.updateApplication('app-1', { status: 'pending' as const })
    ).rejects.toMatchObject(error);

    expect(mockFetch).toHaveBeenCalledWith('/api/applications/app-1', {
      method: 'PATCH',
      body: { status: 'pending' }
    });
  });

  it('createApplication handles expired job deadline error', async () => {
    const error = {
      statusCode: 400,
      statusMessage: 'Cannot apply: Job deadline has passed'
    };

    mockFetch.mockRejectedValue(error);

    const payload = {
      job_id: 'job-1',
      cover_letter: 'Cover letter',
      proposed_rate: 25
    };

    await expect(applicationsComposable.createApplication(payload)).rejects.toMatchObject(error);

    expect(mockFetch).toHaveBeenCalledWith('/api/applications', {
      method: 'POST',
      body: payload
    });
  });

  it('createApplication handles 409 conflict for duplicate application', async () => {
    const error = {
      statusCode: 409,
      statusMessage: 'You have already applied to this job'
    };

    mockFetch.mockRejectedValue(error);

    const payload = {
      job_id: 'job-1',
      cover_letter: 'Cover letter',
      proposed_rate: 25
    };

    await expect(applicationsComposable.createApplication(payload)).rejects.toMatchObject(error);

    expect(mockFetch).toHaveBeenCalledWith('/api/applications', {
      method: 'POST',
      body: payload
    });
  });
});
