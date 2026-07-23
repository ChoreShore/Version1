import type { ContractWithDetailsInput, ContractsResponseInput, ContractResponseInput, CompletionResponseInput } from '~/schemas/contract';

export const useContracts = () => {
  const getContract = async (contractId: string) => {
    return await $fetch<ContractResponseInput>(`/api/contracts/${contractId}`);
  };

  const createContract = async (payload: {
    application_id: string;
    employer_id: string;
    worker_id: string;
    job_id: string;
  }) => {
    return await $fetch<ContractResponseInput>('/api/contracts', {
      method: 'POST',
      body: payload
    });
  };

  const getContractByJob = async (jobId: string) => {
    return await $fetch<ContractResponseInput>(`/api/contracts/job/${jobId}`);
  };

  const listMyContracts = async (userId: string) => {
    return await $fetch<ContractsResponseInput>('/api/contracts', {
      params: { user_id: userId }
    });
  };

  const markComplete = async (contractId: string) => {
    return await $fetch<CompletionResponseInput>(`/api/contracts/${contractId}/complete`, {
      method: 'POST'
    });
  };

  const approveCompletion = async (contractId: string) => {
    return await $fetch<CompletionResponseInput>(`/api/contracts/${contractId}/approve`, {
      method: 'POST'
    });
  };

  const rejectCompletion = async (contractId: string) => {
    return await $fetch<CompletionResponseInput>(`/api/contracts/${contractId}/reject-completion`, {
      method: 'POST'
    });
  };

  return {
    getContract,
    createContract,
    getContractByJob,
    listMyContracts,
    markComplete,
    approveCompletion,
    rejectCompletion
  };
};
