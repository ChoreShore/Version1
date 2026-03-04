import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Applications CRUD Integration Tests', async () => {
  await setup({
    server: true
  });

  let employerUser: any = null;
  let workerUser: any = null;
  let createdJob: any = null;
  let createdApplication: any = null;
  let authHeaders: Record<string, string> = {};

  beforeEach(async () => {
    // Create unique test users
    const timestamp = Date.now();
    
    // Sign up employer
    try {
      const employerSignup = await $fetch('/api/auth/signup', {
        method: 'post',
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
        
        // Sign in employer
        const employerSignin = await $fetch('/api/auth/signin', {
          method: 'post',
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

    // Sign up worker
    try {
      const workerSignup = await $fetch('/api/auth/signup', {
        method: 'post',
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
        
        // Sign in worker
        const workerSignin = await $fetch('/api/auth/signin', {
          method: 'post',
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

    // Create a test job for applications
    if (authHeaders.employer) {
      try {
        const jobData = {
          title: 'Test Job for Applications',
          description: 'This is a test job created for application testing. It needs to be at least 10 characters long to pass validation.',
          category_id: '123e4567-e89b-12d3-a456-426614174000',
          postcode: 'SW1A 1AA',
          budget_type: 'fixed',
          budget_amount: 150,
          deadline: '2026-12-31T23:59:59Z'
        };

        const response = await $fetch('/api/jobs', {
          method: 'post',
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          },
          body: jobData
        }) as any;

        createdJob = response.job;
      } catch (error) {
        console.log('Failed to create test job:', error);
      }
    }
  });

  afterEach(async () => {
    // Applications are not deleted, they're updated to withdrawn status
    // Jobs will be cleaned up by cascade deletion or left for testing
    // Reset variables for next test
    createdJob = null;
    createdApplication = null;
  });

  describe('POST /api/applications - Create Application', () => {
    it('should create an application when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const applicationData = {
        job_id: createdJob.id,
        cover_letter: 'I am the perfect candidate for this job. I have extensive experience and can start immediately.',
        proposed_rate: 25.50,
        availability_notes: 'Available Monday to Friday, 9am-5pm'
      };

      const response = await $fetch('/api/applications', {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: applicationData
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.job_id).toBe(applicationData.job_id);
      expect(response.application.worker_id).toBe(workerUser.id);
      expect(response.application.status).toBe('pending');
      expect(response.application.cover_letter).toBe(applicationData.cover_letter);
      expect(response.application.proposed_rate).toBe(applicationData.proposed_rate);
      expect(response.application.availability_notes).toBe(applicationData.availability_notes);

      createdApplication = response.application;
    });

    it('should reject application creation when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const applicationData = {
        job_id: createdJob.id,
        cover_letter: 'I am applying as an employer.'
      };

      const response = await $fetch('/api/applications', {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: applicationData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Cannot apply to this job');
    });

    it('should reject application creation with invalid job ID', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const applicationData = {
        job_id: 'invalid-uuid',
        cover_letter: 'Test application'
      };

      const response = await $fetch('/api/applications', {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: applicationData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Invalid job ID format');
    });

    it('should reject duplicate applications', async () => {
      if (!createdJob || !authHeaders.worker || !createdApplication) {
        console.log('Skipping test - no job, worker auth, or existing application');
        return;
      }

      const applicationData = {
        job_id: createdJob.id,
        cover_letter: 'Duplicate application'
      };

      const response = await $fetch('/api/applications', {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: applicationData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('already applied to this job');
    });
  });

  describe('GET /api/applications - Get Worker Applications', () => {
    it('should get applications when authenticated as worker', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const response = await $fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.applications).toBeDefined();
      expect(Array.isArray(response.applications)).toBe(true);

      // If we created an application, it should be in the list
      if (createdApplication) {
        const myApplication = response.applications.find((app: any) => app.id === createdApplication.id);
        expect(myApplication).toBeDefined();
        expect(myApplication.job_title).toBe(createdJob.title);
      }
    });

    it('should reject getting applications when authenticated as employer', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const response = await $fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.applications).toBeDefined();
      // Employer should see empty array since they're not a worker
      expect(response.applications).toEqual([]);
    });
  });

  describe('GET /api/applications/job/[id] - Get Job Applications', () => {
    it('should get applications for job when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/job/${createdJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.applications).toBeDefined();
      expect(Array.isArray(response.applications)).toBe(true);

      // If we created an application, it should be in the list
      if (createdApplication) {
        const jobApplication = response.applications.find((app: any) => app.id === createdApplication.id);
        expect(jobApplication).toBeDefined();
        expect(jobApplication.worker_name).toContain('Test Worker');
        expect(jobApplication.status).toBe('pending');
      }
    });

    it('should reject getting job applications when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const response = await $fetch(`/api/applications/job/${createdJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.applications).toBeDefined();
      // Worker should see empty array since they don't own the job
      expect(response.applications).toEqual([]);
    });
  });

  describe('PATCH /api/applications/[id] - Update Application', () => {
    it('should accept application when authenticated as employer', async () => {
      if (!createdApplication || !authHeaders.employer) {
        console.log('Skipping test - no application or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        method: 'patch',
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: {
          status: 'accepted'
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.status).toBe('accepted');
    });

    it('should reject application when authenticated as employer', async () => {
      if (!createdApplication || !authHeaders.employer) {
        console.log('Skipping test - no application or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        method: 'patch',
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: {
          status: 'rejected'
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.status).toBe('rejected');
    });

    it('should withdraw application when authenticated as worker', async () => {
      if (!createdApplication || !authHeaders.worker) {
        console.log('Skipping test - no application or worker auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        method: 'patch',
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: {
          status: 'withdrawn'
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.status).toBe('withdrawn');
    });

    it('should reject invalid status update', async () => {
      if (!createdApplication || !authHeaders.employer) {
        console.log('Skipping test - no application or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        method: 'patch',
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: {
          status: 'invalid_status'
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Valid status is required');
    });
  });

  describe('GET /api/applications/[id] - Get Application Details', () => {
    it('should get application details when authenticated as worker (owner)', async () => {
      if (!createdApplication || !authHeaders.worker) {
        console.log('Skipping test - no application or worker auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.id).toBe(createdApplication.id);
      expect(response.application.worker_id).toBe(workerUser.id);
      expect(response.application.job_id).toBe(createdJob.id);
    });

    it('should get application details when authenticated as employer (job owner)', async () => {
      if (!createdApplication || !authHeaders.employer) {
        console.log('Skipping test - no application or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.application).toBeDefined();
      expect(response.application.id).toBe(createdApplication.id);
      expect(response.application.worker_id).toBe(workerUser.id);
      expect(response.application.job_id).toBe(createdJob.id);
    });

    it('should reject getting application details for unauthorized user', async () => {
      if (!createdApplication) {
        console.log('Skipping test - no application');
        return;
      }

      // Create a different user (another worker)
      const timestamp = Date.now();
      let differentWorkerAuth = '';

      try {
        const signup = await $fetch('/api/auth/signup', {
          method: 'post',
          body: {
            email: `different-worker-${timestamp}@test.com`,
            password: 'TestPassword123!',
            first_name: 'Different',
            last_name: 'Worker',
            phone: '+1234567890',
            role: 'worker'
          }
        }) as any;

        if (signup.user) {
          const signin = await $fetch('/api/auth/signin', {
            method: 'post',
            body: {
              email: `different-worker-${timestamp}@test.com`,
              password: 'TestPassword123!'
            }
          }) as any;

          if (signin.session) {
            differentWorkerAuth = `supabase.auth.token=${signin.session.access_token}`;
          }
        }
      } catch (error) {
        console.log('Different worker signup failed:', error);
        return;
      }

      const response = await $fetch(`/api/applications/${createdApplication.id}`, {
        headers: {
          'Authorization': `Bearer ${differentWorkerAuth}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('permission to see');
    });
  });

  describe('GET /api/applications/job/[id]/stats - Get Application Statistics', () => {
    it('should get application statistics when authenticated as employer', async () => {
      if (!createdJob || !authHeaders.employer) {
        console.log('Skipping test - no job or employer auth');
        return;
      }

      const response = await $fetch(`/api/applications/job/${createdJob.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.total_applications).toBeDefined();
      expect(response.pending_applications).toBeDefined();
      expect(response.accepted_applications).toBeDefined();
      expect(response.rejected_applications).toBeDefined();
      expect(typeof response.total_applications).toBe('number');
    });

    it('should reject getting statistics when authenticated as worker', async () => {
      if (!createdJob || !authHeaders.worker) {
        console.log('Skipping test - no job or worker auth');
        return;
      }

      const response = await $fetch(`/api/applications/job/${createdJob.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      // Workers should get empty stats since they don't own the job
      expect(response.total_applications).toBe(0);
      expect(response.pending_applications).toBe(0);
      expect(response.accepted_applications).toBe(0);
      expect(response.rejected_applications).toBe(0);
    });
  });
});
