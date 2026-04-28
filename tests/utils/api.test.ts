import { describe, it, expect, vi } from 'vitest';
import { createError } from 'h3';
import {
  ensureJobOwner,
  ensureJobEmployer,
  ensureApplicationOwner,
  ensureContractParticipant,
  ensureMessageParticipant,
  ensurePaymentOwner
} from '~/server/utils/api';

// Mock Supabase client
const createMockClient = (data: any = null, error: any = null) => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data, error })),
        maybeSingle: vi.fn(() => Promise.resolve({ data, error }))
      }))
    }))
  }))
});

describe('Authorization Helper Functions', () => {
  describe('ensureJobOwner', () => {
    it('should allow access when user owns the job', async () => {
      const mockClient = createMockClient({ employer_id: 'user-123' });
      await expect(ensureJobOwner(mockClient as any, 'job-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 404 when job not found', async () => {
      const mockClient = createMockClient(null, { code: 'PGRST116' });
      await expect(ensureJobOwner(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Job not found'
      });
    });

    it('should throw 403 when user does not own the job', async () => {
      const mockClient = createMockClient({ employer_id: 'other-user' });
      await expect(ensureJobOwner(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You can only access your own jobs'
      });
    });
  });

  describe('ensureJobEmployer', () => {
    it('should call ensureJobOwner and allow access when user is employer', async () => {
      const mockClient = createMockClient({ employer_id: 'user-123' });
      await expect(ensureJobEmployer(mockClient as any, 'job-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 403 when user is not employer', async () => {
      const mockClient = createMockClient({ employer_id: 'other-user' });
      await expect(ensureJobEmployer(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You can only access your own jobs'
      });
    });
  });

  describe('ensureApplicationOwner', () => {
    it('should allow access when user owns the application', async () => {
      const mockClient = createMockClient({ worker_id: 'user-123' });
      await expect(ensureApplicationOwner(mockClient as any, 'app-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 404 when application not found', async () => {
      const mockClient = createMockClient(null, { code: 'PGRST116' });
      await expect(ensureApplicationOwner(mockClient as any, 'app-1', 'user-123')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Application not found'
      });
    });

    it('should throw 403 when user does not own the application', async () => {
      const mockClient = createMockClient({ worker_id: 'other-user' });
      await expect(ensureApplicationOwner(mockClient as any, 'app-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You can only access your own applications'
      });
    });
  });

  describe('ensureContractParticipant', () => {
    it('should allow access when user is the employer', async () => {
      const mockClient = createMockClient({ employer_id: 'user-123', worker_id: 'worker-456' });
      await expect(ensureContractParticipant(mockClient as any, 'contract-1', 'user-123')).resolves.not.toThrow();
    });

    it('should allow access when user is the worker', async () => {
      const mockClient = createMockClient({ employer_id: 'employer-789', worker_id: 'user-123' });
      await expect(ensureContractParticipant(mockClient as any, 'contract-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 404 when contract not found', async () => {
      const mockClient = createMockClient(null, { code: 'PGRST116' });
      await expect(ensureContractParticipant(mockClient as any, 'contract-1', 'user-123')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Contract not found'
      });
    });

    it('should throw 403 when user is not a participant', async () => {
      const mockClient = createMockClient({ employer_id: 'employer-789', worker_id: 'worker-456' });
      await expect(ensureContractParticipant(mockClient as any, 'contract-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You do not have access to this contract'
      });
    });
  });

  describe('ensureMessageParticipant', () => {
    it('should allow access when user is the employer', async () => {
      const mockClient = createMockClient({ employer_id: 'user-123' });
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).resolves.not.toThrow();
    });

    it('should allow access when user is a worker with pending application', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'jobs') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { employer_id: 'employer-789' }, error: null }))
                }))
              }))
            };
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(() => Promise.resolve({ 
                      data: { worker_id: 'user-123', status: 'pending' }, 
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
          return {};
        })
      };
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).resolves.not.toThrow();
    });

    it('should allow access when user is a worker with accepted application', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'jobs') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { employer_id: 'employer-789' }, error: null }))
                }))
              }))
            };
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(() => Promise.resolve({ 
                      data: { worker_id: 'user-123', status: 'accepted' }, 
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
          return {};
        })
      };
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 404 when job not found', async () => {
      const mockClient = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
            }))
          }))
        }))
      };
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Job not found'
      });
    });

    it('should throw 403 when user has no application for the job', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'jobs') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { employer_id: 'employer-789' }, error: null }))
                }))
              }))
            };
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
                  }))
                }))
              }))
            };
          }
          return {};
        })
      };
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You are not authorized to view messages for this job'
      });
    });

    it('should throw 403 when application status does not allow messaging', async () => {
      const mockClient = {
        from: vi.fn((table: string) => {
          if (table === 'jobs') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { employer_id: 'employer-789' }, error: null }))
                }))
              }))
            };
          }
          if (table === 'applications') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    maybeSingle: vi.fn(() => Promise.resolve({ 
                      data: { worker_id: 'user-123', status: 'rejected' }, 
                      error: null 
                    }))
                  }))
                }))
              }))
            };
          }
          return {};
        })
      };
      await expect(ensureMessageParticipant(mockClient as any, 'job-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'Messaging disabled for this application status'
      });
    });
  });

  describe('ensurePaymentOwner', () => {
    it('should allow access when user is the employer', async () => {
      const mockClient = createMockClient({ employer_id: 'user-123', worker_id: 'worker-456' });
      await expect(ensurePaymentOwner(mockClient as any, 'payment-1', 'user-123')).resolves.not.toThrow();
    });

    it('should allow access when user is the worker', async () => {
      const mockClient = createMockClient({ employer_id: 'employer-789', worker_id: 'user-123' });
      await expect(ensurePaymentOwner(mockClient as any, 'payment-1', 'user-123')).resolves.not.toThrow();
    });

    it('should throw 404 when payment transaction not found', async () => {
      const mockClient = createMockClient(null, { code: 'PGRST116' });
      await expect(ensurePaymentOwner(mockClient as any, 'payment-1', 'user-123')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Payment transaction not found'
      });
    });

    it('should throw 403 when user is not the payment owner', async () => {
      const mockClient = createMockClient({ employer_id: 'employer-789', worker_id: 'worker-456' });
      await expect(ensurePaymentOwner(mockClient as any, 'payment-1', 'user-123')).rejects.toMatchObject({
        statusCode: 403,
        statusMessage: 'You do not have access to this payment'
      });
    });
  });
});
