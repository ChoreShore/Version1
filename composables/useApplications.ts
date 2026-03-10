import type {
  CreateApplicationInput,
  ApplicationsResponseInput,
  ApplicationResponseInput,
  UpdateApplicationInput,
  ApplicationStatsResponseInput
} from '~/schemas/application';
import type { Role } from '~/schemas/role';

export const useApplications = () => {
  const listMyApplications = async (role?: Role) => {
    return await $fetch<ApplicationsResponseInput>('/api/applications', {
      params: role ? { role } : undefined
    });
  };

  const getApplication = async (applicationId: string) => {
    return await $fetch<ApplicationResponseInput>(`/api/applications/${applicationId}`);
  };

  const createApplication = async (payload: CreateApplicationInput) => {
    return await $fetch<ApplicationResponseInput>('/api/applications', {
      method: 'POST',
      body: payload
    });
  };

  const updateApplication = async (applicationId: string, payload: UpdateApplicationInput) => {
    return await $fetch<ApplicationResponseInput>(`/api/applications/${applicationId}`, {
      method: 'PATCH',
      body: payload
    });
  };

  const getJobApplications = async (jobId: string) => {
    return await $fetch<ApplicationsResponseInput>(`/api/applications/job/${jobId}`);
  };

  const getJobApplicationStats = async (jobId: string) => {
    return await $fetch<ApplicationStatsResponseInput>(`/api/applications/job/${jobId}/stats`);
  };

  return {
    listMyApplications,
    getApplication,
    createApplication,
    updateApplication,
    getJobApplications,
    getJobApplicationStats
  };
};
