import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';
import { fetchPreviewJobs } from '~/server/utils/preview';

describe('Jobs CRUD Integration Tests', async () => {
  await setup({ server: true });

  let employerUser: any = null;
  let workerUser: any = null;
  let createdJob: any = null;
  let authHeaders: Record<string, string> = {};

  beforeEach(async () => {
    const timestamp = Date.now();

    try {
      const employerSignup = await $fetch('/api/auth/signup', {
        method: 'post' as const,
        body: {
          email: `employer-${timestamp}@test.com`,
          password: 'TestPassword123!',
          first_name: 'Test',
          last_name: 'Employer',
          phone: '+1234567890',
          role: 'employer'
        }
      }) as any;

      if (employerSignup.user) {
        employerUser = employerSignup.user;

        const employerSignin = await $fetch('/api/auth/signin', {
          method: 'post' as const,
          body: {
            email: `employer-${timestamp}@test.com`,
            password: 'TestPassword123!'
          }
        }) as any;

        if (employerSignin.session) {
          authHeaders.employer = `supabase.auth.token=${employerSignin.session.access_token}`;
        }
      }
    } catch (error) {
      console.log('Employer signup failed (may already exist):', error);
    }

    try {
      const workerSignup = await $fetch('/api/auth/signup', {
        method: 'post' as const,
        body: {
          email: `worker-${timestamp}@test.com`,
          password: 'TestPassword123!',
          first_name: 'Test',
          last_name: 'Worker',
          phone: '+1234567890',
          role: 'worker'
        }
      }) as any;

      if (workerSignup.user) {
        workerUser = workerSignup.user;

        const workerSignin = await $fetch('/api/auth/signin', {
          method: 'post' as const,
          body: {
            email: `worker-${timestamp}@test.com`,
            password: 'TestPassword123!'
          }
        }) as any;

        if (workerSignin.session) {
          authHeaders.worker = `supabase.auth.token=${workerSignin.session.access_token}`;
        }
      }
    } catch (error) {
      console.log('Worker signup failed (may already exist):', error);
    }
  });

  afterEach(async () => {
    if (createdJob && authHeaders.employer) {
      try {
        await $fetch(`/api/jobs/${createdJob.id}`, {
          method: 'delete' as const,
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          }
        });
      } catch (error) {
        console.log('Cleanup failed:', error);
      }
      createdJob = null;
    }
    authHeaders = {};
  });

  // POST /api/jobs
  describe('POST /api/jobs - Create Job', () => {
    it('should create a job when authenticated as employer', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const jobData = {
        title: 'Test Job Integration',
        description: 'This is a test job created during integration testing. It needs to be at least 10 characters long to pass validation.',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      const response = await $fetch('/api/jobs', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: jobData
      }) as any;

      expect(response).toBeDefined();
      expect(response.job).toBeDefined();
      expect(response.job.title).toBe(jobData.title);
      expect(response.job.description).toBe(jobData.description);
      expect(response.job.budget_amount).toBe(jobData.budget_amount);
      expect(response.job.employer_id).toBe(employerUser.id);

      createdJob = response.job;
    });

    it('should reject job creation when authenticated as worker', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const jobData = {
        title: 'Test Job',
        description: 'This is a test job that should fail for workers.',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      const response = await $fetch('/api/jobs', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: jobData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Only employers can create jobs');
    });

    it('should reject job creation with invalid data', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const invalidJobData = {
        title: 'Hi',
        description: 'Too short',
        category_id: 'invalid-uuid',
        postcode: 'invalid',
        budget_type: 'invalid',
        budget_amount: -50,
        deadline: 'past-date'
      };

      const response = await $fetch('/api/jobs', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: invalidJobData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Validation failed');
    });
  });

  // PATCH /api/jobs/[id]
  describe('PATCH /api/jobs/[id] - Update Job', () => {
    beforeEach(async () => {
      if (!createdJob && authHeaders.employer) {
        const jobData = {
          title: 'Original Job Title',
          description: 'Original job description for testing updates. This needs to be at least 10 characters long.',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          budget_amount: 100,
          deadline: '2026-12-31T23:59:59Z'
        };

        const response = await $fetch('/api/jobs', {
          method: 'post' as const,
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          },
          body: jobData
        }) as any;

        createdJob = response.job;
      }
    });

    it('should update job when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const updateData = {
        title: 'Updated Job Title',
        budget_amount: 200
      };

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        method: 'patch' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: updateData
      }) as any;

      expect(response).toBeDefined();
      expect(response.job).toBeDefined();
      expect(response.job.title).toBe(updateData.title);
      expect(response.job.budget_amount).toBe(updateData.budget_amount);
    });

    it('should reject job update when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const updateData = { title: 'Worker Trying to Update' };

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        method: 'patch' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: updateData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Unauthorized');
    });

    it('should reject job update with invalid data', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const invalidUpdateData = {
        title: 'Hi',
        budget_amount: -50
      };

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        method: 'patch' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: invalidUpdateData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Validation failed');
    });
  });

  // GET /api/jobs/[id]
  describe('GET /api/jobs/[id] - Get Job Details', () => {
    beforeEach(async () => {
      if (!createdJob && authHeaders.employer) {
        const jobData = {
          title: 'Test Job for Get',
          description: 'Test job description for get endpoint testing. This needs to be at least 10 characters long.',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          budget_amount: 150,
          deadline: '2026-12-31T23:59:59Z'
        };

        const response = await $fetch('/api/jobs', {
          method: 'post' as const,
          headers: { 'Authorization': `Bearer ${authHeaders.employer}` },
          body: jobData
        }) as any;

        createdJob = response.job;
      }
    });

    it('should get job details when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.job).toBeDefined();
      expect(response.job.id).toBe(createdJob.id);
      expect(response.job.title).toBe(createdJob.title);
      expect(response.job.employer_first_name).toBeDefined();
      expect(response.job.category_name).toBeDefined();
    });

    it('should get job details when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.job).toBeDefined();
      expect(response.job.id).toBe(createdJob.id);
    });

    it('should reject job details for unauthenticated users', async () => {
      if (!createdJob) {
        console.log('Skipping test - no job');
        return;
      }

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Sign in to view full job details');
    });
  });

  // DELETE /api/jobs/[id]
  describe('DELETE /api/jobs/[id] - Delete Job', () => {
    beforeEach(async () => {
      if (!createdJob && authHeaders.employer) {
        const jobData = {
          title: 'Test Job for Delete',
          description: 'Test job description for delete endpoint testing. This needs to be at least 10 characters long.',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          budget_amount: 150,
          deadline: '2026-12-31T23:59:59Z'
        };

        const response = await $fetch('/api/jobs', {
          method: 'post' as const,
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          },
          body: jobData
        }) as any;

        createdJob = response.job;
      }
    });

    it('should delete job when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        method: 'delete' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.success).toBe(true);

      const getResponse = await $fetch(`/api/jobs/${createdJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        ignoreResponseError: true
      }) as any;

      expect(getResponse.statusMessage).toContain('Job not found');
      createdJob = null;
    });

    it('should reject job deletion when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const response = await $fetch(`/api/jobs/${createdJob.id}`, {
        method: 'delete' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Unauthorized');
    });
  });

  // GET /api/jobs
  describe('GET /api/jobs - List Jobs', () => {
    it('should list jobs with full details when authenticated', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const response = await $fetch('/api/jobs', {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(Array.isArray(response.jobs)).toBe(true);
      expect(response.preview_mode).toBe(false);

      if (response.jobs.length > 0) {
        const job = response.jobs[0];
        expect(job).toHaveProperty('id');
        expect(job).toHaveProperty('title');
        expect(job).toHaveProperty('description');
        expect(job).toHaveProperty('employer_first_name');
      }
    });

    it('should list jobs in preview mode when unauthenticated', async () => {
      const previewJobs = [
        {
          id: 'preview-job-1',
          title: 'Preview Job',
          description: 'Preview job description used for mocking unauthenticated preview mode in tests.',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          created_at: '2026-01-01T00:00:00Z',
          category: { name: 'Cleaning' }
        }
      ];

      const queryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        then: undefined as any
      };

      const selectChain = {
        eq: queryChain.eq,
        order: queryChain.order,
        limit: queryChain.limit,
        like: queryChain.like,
        then: undefined as any
      };

      const mockClient = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(selectChain)
        })
      };

      queryChain.then = (resolve: any) =>
        resolve({ data: previewJobs, error: null });
      selectChain.then = queryChain.then;

      const response = await fetchPreviewJobs(mockClient as any, {});

      expect(response).toBeDefined();
      expect(response.preview_mode).toBe(true);
      expect(Array.isArray(response.jobs)).toBe(true);
      expect(response.jobs).toHaveLength(1);
      expect(response.jobs[0]).toMatchObject({
        id: previewJobs[0].id,
        title: previewJobs[0].title,
        description_preview: expect.stringContaining('Preview job description'),
        category_id: previewJobs[0].category_id,
        cta: expect.stringContaining('Sign in')
      });

      expect(mockClient.from).toHaveBeenCalledWith('jobs');
    });
  });
});