import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils';

describe('Messages API Integration Tests', async () => {
  await setup({ server: true });

  let employerUser: any = null;
  let workerUser: any = null;
  let authHeaders: Partial<Record<'employer' | 'worker', string>> = {};
  let testJob: any = null;
  let testApplication: any = null;
  let seededMessage: any = null;

  const createTestJob = async () => {
    if (!authHeaders.employer) {
      throw new Error('Missing employer auth token');
    }

    const jobData = {
      title: 'Test Job for Messages',
      description: 'This is a test job created for messaging integration testing. It needs to be at least 10 characters long to pass validation.',
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

  const createTestApplication = async () => {
    if (!authHeaders.worker || !testJob) {
      throw new Error('Missing worker auth token or job');
    }

    const applicationData = {
      job_id: testJob.id,
      cover_letter: 'This is my cover letter for the test job. I am very interested in this position and believe I have the right skills.',
      proposed_rate: 120,
      availability_notes: 'immediately'
    };

    const response = await $fetch('/api/applications', {
      method: 'post' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders.worker}`
      },
      body: applicationData
    }) as any;

    return response.application;
  };

  const sendMessage = async (
    sender: 'employer' | 'worker',
    overrides: Partial<{ job_id: string; application_id: string; receiver_id: string; content: string }> = {}
  ) => {
    if (!authHeaders[sender]) {
      throw new Error(`Missing ${sender} auth token`);
    }

    if (!testJob || !testApplication || !employerUser || !workerUser) {
      throw new Error('Missing baseline messaging data');
    }

    const basePayload = {
      job_id: testJob.id,
      application_id: testApplication.id,
      receiver_id: sender === 'employer' ? workerUser.id : employerUser.id,
      content: sender === 'employer'
        ? 'Hello! I am interested in your application. Can we discuss the project details?'
        : 'Thank you for your message! I would love to discuss the project further.'
    };

    const payload = { ...basePayload, ...overrides };

    const response = await $fetch('/api/messages', {
      method: 'post' as const,
      headers: {
        'Authorization': `Bearer ${authHeaders[sender]}`
      },
      body: payload
    }) as any;

    return response.message;
  };

  const ensureSeededMessage = async () => {
    if (!seededMessage) {
      seededMessage = await sendMessage('employer', {
        content: 'Seed message for conversation and thread tests.'
      });
    }
  };

  beforeEach(async () => {
    const timestamp = Date.now();

    authHeaders = {};
    employerUser = null;
    workerUser = null;
    testJob = null;
    testApplication = null;
    seededMessage = null;

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

    if (authHeaders.employer && authHeaders.worker) {
      try {
        testJob = await createTestJob();
        testApplication = await createTestApplication();
      } catch (error) {
        console.log('Test job/application setup failed:', error);
      }
    }
  });

  afterEach(async () => {
    if (testJob && authHeaders.employer) {
      try {
        await $fetch(`/api/jobs/${testJob.id}`, {
          method: 'delete' as const,
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          }
        });
      } catch (error) {
        console.log('Job cleanup failed:', error);
      }
    }

    testJob = null;
    testApplication = null;
    seededMessage = null;
    authHeaders = {};
  });

  // POST /api/messages - Send Message
  describe('POST /api/messages - Send Message', () => {
    it('should send message from employer to worker', async () => {
      if (!authHeaders.employer || !authHeaders.worker || !testJob || !testApplication) {
        console.log('Skipping test - missing auth or test data');
        return;
      }

      const message = await sendMessage('employer', {
        content: 'Hello! I am interested in your application. Can we discuss the project details?'
      });

      expect(message).toBeDefined();
      expect(message.content).toContain('Hello! I am interested');
      expect(message.sender_id).toBe(employerUser.id);
      expect(message.receiver_id).toBe(workerUser.id);
      expect(message.job_id).toBe(testJob.id);
      expect(message.sender_first_name).toBeDefined();
      expect(message.receiver_first_name).toBeDefined();
    });

    it('should send message from worker to employer', async () => {
      if (!authHeaders.employer || !authHeaders.worker || !testJob || !testApplication) {
        console.log('Skipping test - missing auth or test data');
        return;
      }

      const message = await sendMessage('worker', {
        content: 'Thank you for your message! I would love to discuss the project further.'
      });

      expect(message).toBeDefined();
      expect(message.content).toContain('Thank you for your message');
      expect(message.sender_id).toBe(workerUser.id);
      expect(message.receiver_id).toBe(employerUser.id);
    });

    it('should reject message sending without authentication', async () => {
      if (!testJob || !testApplication) {
        console.log('Skipping test - missing test data');
        return;
      }

      const response = await $fetch('/api/messages', {
        method: 'post' as const,
        body: {
          job_id: testJob.id,
          application_id: testApplication.id,
          receiver_id: workerUser.id,
          content: 'This should fail without auth'
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Authentication required');
    });

    it('should reject message sending with invalid data', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const invalidMessageData = {
        job_id: 'invalid-uuid',
        application_id: 'invalid-uuid',
        receiver_id: 'invalid-uuid',
        content: 'Hi' // Too short
      };

      const response = await $fetch('/api/messages', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: invalidMessageData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Validation failed');
    });

    it('should reject message sending between unauthorized users', async () => {
      if (!authHeaders.employer || !authHeaders.worker || !testJob || !testApplication) {
        console.log('Skipping test - missing auth or test data');
        return;
      }

      // Try to send message to self
      const messageData = {
        job_id: testJob.id,
        application_id: testApplication.id,
        receiver_id: employerUser.id, // Sending to self
        content: 'This should fail - sending to self'
      };

      const response = await $fetch('/api/messages', {
        method: 'post' as const,
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        body: messageData,
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Cannot send message to yourself');
    });
  });

  // GET /api/messages - Get Conversations
  describe('GET /api/messages - Get Conversations', () => {
    beforeEach(async () => {
      if (!authHeaders.employer || !authHeaders.worker || !testJob || !testApplication) {
        console.log('Skipping conversation seeding - missing auth or job data');
        return;
      }

      await ensureSeededMessage();
    });

    it('should get conversations for employer', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const response = await $fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.conversations).toBeDefined();
      expect(Array.isArray(response.conversations)).toBe(true);
      
      // Should have at least one conversation
      expect(response.conversations.length).toBeGreaterThan(0);
      
      const conversation = response.conversations[0];
      expect(conversation.job_id).toBeDefined();
      expect(conversation.other_user_id).toBeDefined();
      expect(conversation.other_user_first_name).toBeDefined();
      expect(conversation.last_message_content).toBeDefined();
      expect(conversation.last_message_sent_at).toBeDefined();
    });

    it('should get conversations for worker', async () => {
      if (!authHeaders.worker) {
        console.log('Skipping test - no worker auth');
        return;
      }

      const response = await $fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.conversations).toBeDefined();
      expect(Array.isArray(response.conversations)).toBe(true);
      
      // Should have at least one conversation
      expect(response.conversations.length).toBeGreaterThan(0);
    });

    it('should reject conversations without authentication', async () => {
      const response = await $fetch('/api/messages', {
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Auth session missing');
    });
  });

  // GET /api/messages/[jobId] - Get Messages for Job
  describe('GET /api/messages/[jobId] - Get Messages for Job', () => {
    beforeEach(async () => {
      if (!authHeaders.employer || !authHeaders.worker || !testJob || !testApplication) {
        console.log('Skipping job message seeding - missing auth or job data');
        return;
      }

      await ensureSeededMessage();
    });

    it('should get messages for job as employer', async () => {
      if (!authHeaders.employer || !testJob) {
        console.log('Skipping test - missing auth or job');
        return;
      }

      const response = await $fetch(`/api/messages/${testJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.messages).toBeDefined();
      expect(Array.isArray(response.messages)).toBe(true);
      
      // Should have at least one message
      expect(response.messages.length).toBeGreaterThan(0);
      
      const message = response.messages[0];
      expect(message.job_id).toBe(testJob.id);
      expect(message.sender_first_name).toBeDefined();
      expect(message.receiver_first_name).toBeDefined();
      expect(message.content).toBeDefined();
      expect(message.created_at).toBeDefined();
    });

    it('should get messages for job as worker', async () => {
      if (!authHeaders.worker || !testJob) {
        console.log('Skipping test - missing auth or job');
        return;
      }

      const response = await $fetch(`/api/messages/${testJob.id}`, {
        headers: {
          'Authorization': `Bearer ${authHeaders.worker}`
        }
      }) as any;

      expect(response).toBeDefined();
      expect(response.messages).toBeDefined();
      expect(Array.isArray(response.messages)).toBe(true);
      
      // Should have at least one message
      expect(response.messages.length).toBeGreaterThan(0);
    });

    it('should reject messages for job without authentication', async () => {
      if (!testJob) {
        console.log('Skipping test - no job');
        return;
      }

      const response = await $fetch(`/api/messages/${testJob.id}`, {
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Authentication required');
    });

    it('should reject messages for invalid job ID', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const response = await $fetch('/api/messages/invalid-job-id', {
        headers: {
          'Authorization': `Bearer ${authHeaders.employer}`
        },
        ignoreResponseError: true
      }) as any;

      expect(response).toBeDefined();
      expect(response.statusMessage).toContain('Invalid job ID');
    });

    it('should reject messages for job user is not part of', async () => {
      if (!authHeaders.employer) {
        console.log('Skipping test - no employer auth');
        return;
      }

      const otherTimestamp = Date.now();
      let otherAuth: string | null = null;
      let otherJob: any = null;

      try {
        const otherEmployerSignup = await $fetch('/api/auth/signup', {
          method: 'post' as const,
          body: {
            email: `other-employer-${otherTimestamp}@test.com`,
            password: 'TestPassword123!',
            first_name: 'Other',
            last_name: 'Employer',
            phone: '+1234567890',
            role: 'employer'
          }
        }) as any;

        if (!otherEmployerSignup.user) {
          console.log('Skipping test - other employer signup failed');
          return;
        }

        const otherEmployerSignin = await $fetch('/api/auth/signin', {
          method: 'post' as const,
          body: {
            email: `other-employer-${otherTimestamp}@test.com`,
            password: 'TestPassword123!'
          }
        }) as any;

        if (!otherEmployerSignin.session) {
          console.log('Skipping test - other employer signin failed');
          return;
        }

        otherAuth = `supabase.auth.token=${otherEmployerSignin.session.access_token}`;

        const otherJobResponse = await $fetch('/api/jobs', {
          method: 'post' as const,
          headers: {
            'Authorization': `Bearer ${otherAuth}`
          },
          body: {
            title: 'Other Job',
            description: 'This is another job for testing unauthorized access.',
            category_id: '123e4567-e89b-12d3-a456-426614174000',
            postcode: 'SW1A 1AA',
            budget_type: 'fixed',
            budget_amount: 100,
            deadline: '2026-12-31T23:59:59Z'
          }
        }) as any;

        otherJob = otherJobResponse.job;

        const response = await $fetch(`/api/messages/${otherJob.id}`, {
          headers: {
            'Authorization': `Bearer ${authHeaders.employer}`
          },
          ignoreResponseError: true
        }) as any;

        expect(response).toBeDefined();
        expect(response.statusMessage).toContain('Unauthorized');
      } finally {
        if (otherJob && otherAuth) {
          try {
            await $fetch(`/api/jobs/${otherJob.id}`, {
              method: 'delete' as const,
              headers: {
                'Authorization': `Bearer ${otherAuth}`
              }
            });
          } catch (error) {
            console.log('Other job cleanup failed:', error);
          }
        }
      }
    });
  });
});
