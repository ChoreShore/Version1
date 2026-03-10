import type {
  CreateJobInput,
  UpdateJobInput,
  JobsQueryInput,
  JobsResponseInput,
  JobResponseInput,
  CategoriesResponseInput,
  NearJobsResponseInput
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

  return {
    listJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    listCategories,
    findNearbyJobs
  };
};
