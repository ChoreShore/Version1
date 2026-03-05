import type {
  JobsQuery,
  JobsResponse,
  JobResponse,
  CreateJobPayload,
  UpdateJobPayload,
  CategoriesResponse,
  NearJobsResponse
} from '~/types/job';

export const useJobs = () => {
  const listJobs = async (query?: JobsQuery) => {
    return await $fetch<JobsResponse>('/api/jobs', {
      params: query
    });
  };

  const getJob = async (jobId: string) => {
    return await $fetch<JobResponse>(`/api/jobs/${jobId}`);
  };

  const createJob = async (payload: CreateJobPayload) => {
    return await $fetch<JobResponse>('/api/jobs', {
      method: 'POST',
      body: payload
    });
  };

  const updateJob = async (jobId: string, payload: UpdateJobPayload) => {
    return await $fetch<JobResponse>(`/api/jobs/${jobId}`, {
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
    return await $fetch<CategoriesResponse>('/api/jobs/categories');
  };

  const findNearbyJobs = async (lat: number, lng: number, distanceKm?: number) => {
    const params = {
      lat: lat.toString(),
      lng: lng.toString(),
      ...(distanceKm ? { distance: distanceKm.toString() } : {})
    };

    return await $fetch<NearJobsResponse>('/api/jobs/near', { params });
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
