import type {
  ApplicationsResponse,
  ApplicationResponse,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  JobApplicationsResponse,
  ApplicationStatsResponse
} from '~/types/application';

export const useApplications = () => {
  const listMyApplications = async () => {
    return await $fetch<ApplicationsResponse>('/api/applications');
  };

  const getApplication = async (applicationId: string) => {
    return await $fetch<ApplicationResponse>(`/api/applications/${applicationId}`);
  };

  const createApplication = async (payload: CreateApplicationPayload) => {
    return await $fetch<ApplicationResponse>('/api/applications', {
      method: 'POST',
      body: payload
    });
  };

  const updateApplication = async (applicationId: string, payload: UpdateApplicationPayload) => {
    return await $fetch<ApplicationResponse>(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: payload
    });
  };

  const listJobApplications = async (jobId: string) => {
    return await $fetch<JobApplicationsResponse>(`/api/applications/job/${jobId}`);
  };

  const getJobApplicationStats = async (jobId: string) => {
    return await $fetch<ApplicationStatsResponse>(`/api/applications/job/${jobId}/stats`);
  };

  return {
    listMyApplications,
    getApplication,
    createApplication,
    updateApplication,
    listJobApplications,
    getJobApplicationStats
  };
};
