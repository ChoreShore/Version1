import type {
  CreateJobInput,
  UpdateJobInput,
  JobsQueryInput,
  JobsResponseInput,
  JobResponseInput,
  CategoriesResponseInput,
  NearJobsResponseInput,
  PublicJobsResponseInput
} from '~/schemas/job';
import type { Role } from '~/schemas/role';

export const useJobs = () => {
  const listJobs = async (query?: JobsQueryInput & { role?: Role; scope?: 'mine' | 'all' }) => {
    return await $fetch<JobsResponseInput>('/api/jobs', {
      params: query
    });
  };

  const getJob = async (jobId: string) => {
    return await $fetch<JobResponseInput>(`/api/jobs/${jobId}`);
  };

  const createJob = async (payload: CreateJobInput) => {
    return await $fetch<JobResponseInput>('/api/jobs', {
      method: 'POST',
      body: payload
    });
  };

  const updateJob = async (jobId: string, payload: UpdateJobInput) => {
    return await $fetch<JobResponseInput>(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: payload
    });
  };

  const deleteJob = async (jobId: string) => {
    return await $fetch<{ success: boolean }>(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  };

  const listCategories = async () => {
    return await $fetch<CategoriesResponseInput>('/api/jobs/categories');
  };

  const findNearbyJobs = async (lat: number, lng: number, distanceKm?: number) => {
    const params = {
      lat: lat.toString(),
      lng: lng.toString(),
      ...(distanceKm ? { distance: distanceKm.toString() } : {})
    };

    return await $fetch<NearJobsResponseInput>('/api/jobs/near', { params });
  };

  const getPublicJob = async (jobId: string) => {
    return await $fetch<{
      job: any;
      employer: any;
      application_count: number;
      other_jobs: any[];
    }>(`/api/public/jobs/${jobId}`);
  };

  const listPublicJobs = async (limit?: number, category?: string) => {
    return await $fetch<PublicJobsResponseInput>('/api/public/jobs', {
      params: {
        ...(limit ? { limit: limit.toString() } : {}),
        ...(category ? { category } : {})
      }
    });
  };

  const getPublicStats = async () => {
    return await $fetch<{
      jobs_completed_this_week: number;
      jobs_posted_today: number;
      escrow_protected_payments: number;
    }>('/api/public/stats');
  };

  return {
    listJobs,
    getJob,
    getPublicJob,
    listPublicJobs,
    getPublicStats,
    createJob,
    updateJob,
    deleteJob,
    listCategories,
    findNearbyJobs
  };
};
