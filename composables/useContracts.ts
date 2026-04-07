import type { ContractWithDetailsInput, ContractsResponseInput, ContractResponseInput } from '~/schemas/contract';

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

  return {
    getContract,
    createContract
  };
};
