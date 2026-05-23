import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  let jobData: any = null;
  let reviewsData: any[] = [];
  let employerJobsData: any[] = [];
  let applicationsData: any[] = [];
  let otherJobsData: any[] = [];
  let identityData: any = null;
  let profileData: any = null;

  const setData = (opts: {
    job?: any;
    reviews?: any[];
    employerJobs?: any[];
    applications?: any[];
    otherJobs?: any[];
    identity?: any;
    profile?: any;
  }) => {
    if (opts.job !== undefined) jobData = opts.job;
    if (opts.reviews) reviewsData = opts.reviews;
    if (opts.employerJobs) employerJobsData = opts.employerJobs;
    if (opts.applications) applicationsData = opts.applications;
    if (opts.otherJobs) otherJobsData = opts.otherJobs;
    if (opts.identity) identityData = opts.identity;
    if (opts.profile) profileData = opts.profile;
  };

  let fromCallCount = 0;
  const resetFromCount = () => { fromCallCount = 0; };

  const mockFrom = vi.fn((table: string) => {
    fromCallCount++;

    if (table === 'jobs') {
      if (fromCallCount === 1) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: jobData,
                  error: jobData ? null : { message: 'not found' },
                }),
              }),
            }),
          }),
        };
      }
      if (fromCallCount === 2) {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: employerJobsData, error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              neq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: otherJobsData, error: null }),
                }),
              }),
            }),
          }),
        }),
      };
    }

    if (table === 'reviews') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: reviewsData, error: null }),
        }),
      };
    }

    if (table === 'applications') {
      return {
        select: () => ({
          eq: () => Promise.resolve({ data: applicationsData, error: null }),
        }),
      };
    }

    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: profileData, error: null }),
          }),
        }),
      };
    }

    return { select: () => Promise.resolve({ data: [], error: null }) };
  });

  const mockAuthAdmin = {
    getUserById: () => Promise.resolve(identityData),
  };

  const mockCreateClient = vi.fn(() => ({
    from: mockFrom,
    auth: { admin: mockAuthAdmin },
  }));

  (globalThis as any).defineEventHandler = (fn: any) => fn;
  (globalThis as any).createError = (opts: any) => {
    const err = new Error(opts.statusMessage) as any;
    Object.assign(err, opts);
    return err;
  };
  (globalThis as any).getRouterParam = (_event: any, param: string) => {
    if (param === 'id') return 'job-123';
    return null;
  };

  return { mockCreateClient, mockFrom, setData, resetFromCount };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: mocks.mockCreateClient,
}));

import handler from '~/server/api/public/jobs/[id].get';

const mockEvent = {} as any;

describe('GET /api/public/jobs/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resetFromCount();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

    mocks.setData({
      job: {
        id: 'job-123',
        title: 'Fix my sink',
        description: 'Need a plumber',
        category: { name: 'Plumbing' },
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: 120,
        deadline: '2026-06-01',
        is_recurring: false,
        is_urgent: true,
        created_at: '2026-05-01T10:00:00Z',
        employer_id: 'emp-1',
        latitude: 51.5,
        longitude: -0.1,
      },
      reviews: [],
      employerJobs: [{ id: 'job-456' }, { id: 'job-789' }],
      applications: [],
      otherJobs: [],
      identity: { data: { user: { user_metadata: { identity_verification: { status: 'verified' } } } } },
      profile: { first_name: 'John', last_name: 'Doe', username: 'johndoe', photo_url: null },
    });
  });

  it('returns job details', async () => {
    const result = await handler(mockEvent);
    expect(result.job).toBeDefined();
    expect(result.job.id).toBe('job-123');
  });

  it('returns employer info', async () => {
    const result = await handler(mockEvent);
    expect(result.employer).toBeDefined();
    expect(result.employer.display_name).toBe('John D.');
  });

  it('returns application count', async () => {
    const result = await handler(mockEvent);
    expect(typeof result.application_count).toBe('number');
  });

  it('returns other jobs from same employer', async () => {
    const result = await handler(mockEvent);
    expect(Array.isArray(result.other_jobs)).toBe(true);
  });

  it('throws 404 when job not found', async () => {
    mocks.setData({ job: null });
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Job not found',
    });
  });

  it('throws 400 when job ID is missing', async () => {
    (globalThis as any).getRouterParam = () => null;
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Job ID is required',
    });
  });

  it('throws 500 when Supabase config is missing', async () => {
    delete process.env.SUPABASE_URL;
    await expect(handler(mockEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Supabase configuration missing',
    });
  });
});
