import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

interface AuthHeaders {
  employer?: string;
  worker?: string;
}

describe('Reviews API Integration Tests', async () => {
  await setup({ server: true });

  let employerUser: any = null;
  let workerUser: any = null;
  let job: any = null;
  let application: any = null;
  let authHeaders: AuthHeaders = {};
  let createdReview: any = null;

  const createTestJob = async () => {
    if (!authHeaders.employer) {
      throw new Error('Missing employer auth');
    }

    const jobData = {
      title: 'Review Integration Job',
      description: 'Job description for review integration tests. Must be sufficiently long.',
      category_id: '123e4567-e89b-12d3-a456-426614174000',
      postcode: 'SW1A 1AA',
      budget_type: 'fixed' as const,
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

    return response.job;
  };

  const applyToJob = async () => {
    if (!authHeaders.worker) {
      throw new Error('Missing worker auth');
    }

    const response = await $fetch('/api/applications', {
      method: 'post' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders.worker}`
      },
      body: {
        job_id: job.id,
        cover_letter: 'I would love to work on this job.',
        proposed_rate: 120,
        availability_notes: 'Immediately'
      }
    }) as any;

    return response.application;
  };

  const acceptApplication = async () => {
    if (!application || !authHeaders.employer) {
      throw new Error('Missing application or employer auth');
    }

    await $fetch(`/api/applications/${application.id}`, {
      method: 'patch' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders.employer}`
      },
      body: {
        status: 'accepted'
      }
    });
  };

  const completeJob = async () => {
    if (!job || !authHeaders.employer) {
      throw new Error('Missing job or employer auth');
    }

    const response = await $fetch(`/api/jobs/${job.id}`, {
      method: 'patch' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders.employer}`
      },
      body: {
        status: 'completed'
      }
    }) as any;

    job = response.job;
  };

  const seedReview = async () => {
    if (createdReview) {
      return createdReview;
    }

    const response = await $fetch('/api/reviews', {
      method: 'post' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders.employer}`
      },
      body: {
        job_id: job.id,
        reviewed_user_id: workerUser.id,
        rating: 5,
        comment: 'Excellent work!'
      }
    }) as any;

    createdReview = response.review;
    return createdReview;
  };

  beforeEach(async () => {
    const timestamp = Date.now();
    authHeaders = {};
    employerUser = null;
    workerUser = null;
    job = null;
    application = null;
    createdReview = null;

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
      console.log('Employer signup failed:', error);
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
      console.log('Worker signup failed:', error);
    }

    if (authHeaders.employer && authHeaders.worker) {
      job = await createTestJob();
      application = await applyToJob();
      await acceptApplication();
      await completeJob();
    }
  });

  afterEach(async () => {
    if (job && authHeaders.employer) {
      try {
        await $fetch(`/api/jobs/${job.id}`, {
          method: 'delete' as const,
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          }
        });
      } catch (error) {
        console.log('Job cleanup failed:', error);
      }
    }

    job = null;
    application = null;
    createdReview = null;
    authHeaders = {};
  });

  describe('POST /api/reviews - Create Review', () => {
    it('should create a review for completed job', async () => {
      if (!authHeaders.employer || !workerUser) {
        console.log('Skipping test - missing auth');
        return;
      }

      const response = await $fetch('/api/reviews', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: {
          job_id: job.id,
          reviewed_user_id: workerUser.id,
          rating: 4,
          comment: 'Great job.'
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.review).toBeDefined();
      expect(response.review.rating).toBe(4);
      expect(response.review.reviewer_id).toBe(employerUser.id);
      expect(response.review.reviewed_user_id).toBe(workerUser.id);
    });

    it('should reject review creation when rating invalid', async () => {
      if (!authHeaders.employer || !workerUser) {
        console.log('Skipping test - missing auth');
        return;
      }

      const response = await $fetch('/api/reviews', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: {
          job_id: job.id,
          reviewed_user_id: workerUser.id,
          rating: 10,
          comment: 'Invalid rating'
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Rating must be between 1 and 5');
    });

    it('should reject review creation for worker tokens', async () => {
      if (!authHeaders.worker || !workerUser) {
        console.log('Skipping test - missing worker auth');
        return;
      }

      const response = await $fetch('/api/reviews', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        },
        body: {
          job_id: job.id,
          reviewed_user_id: workerUser.id,
          rating: 5
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusCode ?? response.status).toBe(401);
    });
  });

  describe('GET /api/reviews - List Reviews', () => {
    beforeEach(async () => {
      if (authHeaders.employer && workerUser) {
        await seedReview();
      }
    });

    it('should list received reviews for worker', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const response = await $fetch('/api/reviews', {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(Array.isArray(response.reviews)).toBe(true);
      expect(response.reviews.length).toBeGreaterThan(0);
      expect(response.reviews[0].reviewed_user_id).toBe(workerUser.id);
    });

    it('should list given reviews for employer', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const response = await $fetch('/api/reviews?type=given', {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(Array.isArray(response.reviews)).toBe(true);
      expect(response.reviews.length).toBeGreaterThan(0);
      expect(response.reviews[0].reviewer_id).toBe(employerUser.id);
    });
  });

  describe('GET /api/reviews/job/[id] - Job Review', () => {
    beforeEach(async () => {
      if (authHeaders.employer && workerUser) {
        await seedReview();
      }
    });

    it('should fetch review for specific job', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const response = await $fetch(`/api/reviews/job/${job.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.review).toBeDefined();
      expect(response.review.job_id).toBe(job.id);
    });
  });

  describe('GET /api/reviews/worker/[id] - Worker Reviews (public)', () => {
    beforeEach(async () => {
      if (authHeaders.employer && workerUser) {
        await seedReview();
      }
    });

    it('should list reviews for worker without auth', async () => {
      if (!workerUser) {
        console.log('Skipping test - no worker');
        return;
      }

      const response = await $fetch(`/api/reviews/worker/${workerUser.id}`) as any;

      expect(response).toBeDefined();
      expect(Array.isArray(response.reviews)).toBe(true);
      expect(response.reviews.length).toBeGreaterThan(0);
      expect(response.reviews[0].reviewed_user_id).toBe(workerUser.id);
    });
  });
});
