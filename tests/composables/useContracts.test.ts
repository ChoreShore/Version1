import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useContracts } from '~/composables/useContracts';
import type {
  ContractResponseInput,
  ContractsResponseInput
} from '~/schemas/contract';

const contractsComposable = useContracts();
const mockFetch = vi.fn();

describe('useContracts composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('getContract', () => {
    it('fetches a specific contract by ID', async () => {
      const response: ContractResponseInput = {
        contract: {
          id: 'contract-1',
          application_id: 'app-1',
          employer_id: 'employer-1',
          worker_id: 'worker-1',
          job_id: 'job-1',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await contractsComposable.getContract('contract-1');

      expect(result).toBe(response);
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts/contract-1');
    });

    it('propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Contract not found'));

      await expect(contractsComposable.getContract('contract-1')).rejects.toThrow('Contract not found');
    });
  });

  describe('createContract', () => {
    it('posts payload to /api/contracts', async () => {
      const response: ContractResponseInput = {
        contract: {
          id: 'contract-1',
          application_id: 'app-1',
          employer_id: 'employer-1',
          worker_id: 'worker-1',
          job_id: 'job-1',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const payload = {
        application_id: 'app-1',
        employer_id: 'employer-1',
        worker_id: 'worker-1',
        job_id: 'job-1'
      };

      const result = await contractsComposable.createContract(payload);

      expect(result).toBe(response);
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts', {
        method: 'POST',
        body: payload
      });
    });

    it('propagates fetch errors', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Invalid contract data'
      };

      mockFetch.mockRejectedValue(error);

      const payload = {
        application_id: 'app-1',
        employer_id: 'employer-1',
        worker_id: 'worker-1',
        job_id: 'job-1'
      };

      await expect(contractsComposable.createContract(payload)).rejects.toMatchObject(error);
    });
  });

  describe('getContractByJob', () => {
    it('fetches contract for a specific job', async () => {
      const response: ContractResponseInput = {
        contract: {
          id: 'contract-1',
          application_id: 'app-1',
          employer_id: 'employer-1',
          worker_id: 'worker-1',
          job_id: 'job-1',
          status: 'active',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const result = await contractsComposable.getContractByJob('job-1');

      expect(result).toBe(response);
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts/job/job-1');
    });

    it('propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('No contract found for this job'));

      await expect(contractsComposable.getContractByJob('job-1')).rejects.toThrow('No contract found for this job');
    });
  });

  describe('listMyContracts', () => {
    it('fetches contracts for a specific user', async () => {
      const response: ContractsResponseInput = {
        contracts: [
          {
            id: 'contract-1',
            application_id: 'app-1',
            employer_id: 'employer-1',
            worker_id: 'worker-1',
            job_id: 'job-1',
            status: 'active',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await contractsComposable.listMyContracts('user-1');

      expect(result).toBe(response);
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts', {
        params: { user_id: 'user-1' }
      });
    });

    it('returns empty array when user has no contracts', async () => {
      const response: ContractsResponseInput = {
        contracts: []
      };

      mockFetch.mockResolvedValue(response);

      const result = await contractsComposable.listMyContracts('user-1');

      expect(result.contracts).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith('/api/contracts', {
        params: { user_id: 'user-1' }
      });
    });

    it('propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch contracts'));

      await expect(contractsComposable.listMyContracts('user-1')).rejects.toThrow('Failed to fetch contracts');
    });
  });
});
