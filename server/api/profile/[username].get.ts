import { serverSupabaseClient } from '#supabase/server';
import { getRequestIP } from 'h3';
import { rateLimiters } from '~/server/utils/rateLimit';
import { logDetailedError } from '~/server/utils/logger';

const profileReviewSelect = `
  review_id,
  job_id,
  reviewer_id,
  reviewed_user_id,
  rating,
  comment,
  created_at,
  job:jobs(id, title),
  reviewer:profiles!reviews_reviewer_id_fkey(username, first_name, last_name)
`;

function mapProfileReview(raw: any) {
  return {
    id: raw.review_id,
    job_id: raw.job_id,
    rating: raw.rating,
    comment: raw.comment,
    created_at: raw.created_at,
    job_title: raw.job?.title ?? null,
    reviewer_username: raw.reviewer?.username ?? null,
    reviewer_first_name: raw.reviewer?.first_name ?? null,
    reviewer_last_name: raw.reviewer?.last_name ?? null
  };
}

export default defineEventHandler(async (event) => {
  try {
    const username = getRouterParam(event, 'username');
    if (!username) {
      throw createError({ statusCode: 400, statusMessage: 'Username is required' });
    }

    const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
    await rateLimiters.general(clientIp, event);

    const client = await serverSupabaseClient(event);

    // 1. Fetch profile + auth user data
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, username, first_name, last_name, bio, photo_url, roles, postcode, rtw_status, created_at')
      .eq('username', username)
      .maybeSingle();

    if (profileError) {
      logDetailedError(profileError, 'profile-fetch');
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch profile' });
    }

    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Profile not found' });
    }

    const profileId = profile.id;
    const roles: string[] = profile.roles || [];

    // 1b. Fetch auth user data for email verification
    const { data: authUser } = await client.auth.admin.getUserById(profileId);
    const emailVerified = authUser?.user?.email_confirmed_at ? true : false;

    // 2. Worker stats: completed contracts with job details
    let workerStats = null;
    if (roles.includes('worker')) {
      const { data: contracts, error: contractsError } = await client
        .from('contracts')
        .select(`
          id,
          status,
          created_at,
          job:jobs(id, title, postcode, budget_amount, budget_type)
        `)
        .eq('worker_id', profileId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (contractsError) {
        logDetailedError(contractsError, 'worker-contracts-fetch');
      }

      workerStats = {
        completed_contracts: contracts || [],
        total_jobs_completed: contracts?.length ?? 0
      };
    }

    // 3. Employer stats: jobs posted + application counts
    let employerStats = null;
    if (roles.includes('employer')) {
      const { data: jobs, error: jobsError } = await client
        .from('jobs')
        .select('id, title, postcode, budget_amount, budget_type, status, created_at')
        .eq('employer_id', profileId)
        .order('created_at', { ascending: false });

      if (jobsError) {
        logDetailedError(jobsError, 'employer-jobs-fetch');
      }

      const jobIds = (jobs || []).map((j: any) => j.id);
      const applicationsPerJob = new Map<string, number>();

      if (jobIds.length > 0) {
        const { data: applications } = await client
          .from('applications')
          .select('job_id')
          .in('job_id', jobIds);

        for (const app of applications || []) {
          const id = (app as any).job_id;
          applicationsPerJob.set(id, (applicationsPerJob.get(id) || 0) + 1);
        }
      }

      const jobsWithApplications = (jobs || []).map((job: any) => ({
        ...job,
        application_count: applicationsPerJob.get(job.id) ?? 0
      }));

      employerStats = {
        jobs_posted: jobsWithApplications,
        total_jobs_posted: jobsWithApplications.length
      };
    }

    // 4. Reviews
    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select(profileReviewSelect)
      .eq('reviewed_user_id', profileId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      logDetailedError(reviewsError, 'reviews-fetch');
    }

    // 5. Fetch jobs + contracts for review context
    const reviewJobIds = [...new Set((reviews || []).map(r => r.job_id))];
    const reviewContext = new Map<string, { employer_id?: string; worker_id?: string }>();

    if (reviewJobIds.length > 0) {
      const { data: jobsForReviews } = await client
        .from('jobs')
        .select('id, employer_id')
        .in('id', reviewJobIds);

      for (const job of jobsForReviews || []) {
        reviewContext.set(job.id, { employer_id: job.employer_id });
      }

      const { data: contractsForReviews } = await client
        .from('contracts')
        .select('job_id, worker_id, employer_id')
        .in('job_id', reviewJobIds);

      for (const contract of contractsForReviews || []) {
        const ctx = reviewContext.get(contract.job_id) || {};
        ctx.worker_id = contract.worker_id;
        ctx.employer_id = contract.employer_id;
        reviewContext.set(contract.job_id, ctx);
      }
    }

    // 6. Categorize reviews
    const reviewsAsWorker: any[] = [];
    const reviewsAsEmployer: any[] = [];

    for (const review of (reviews || [])) {
      const ctx = reviewContext.get(review.job_id);
      const mapped = mapProfileReview(review);

      if (review.reviewed_user_id === ctx?.employer_id) {
        reviewsAsEmployer.push(mapped);
      } else if (review.reviewed_user_id === ctx?.worker_id) {
        reviewsAsWorker.push(mapped);
      } else {
        // Fallback: treat as worker review if context unclear
        reviewsAsWorker.push(mapped);
      }
    }

    // 7. Calculate averages
    const workerAvgRating = reviewsAsWorker.length > 0
      ? reviewsAsWorker.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsAsWorker.length
      : null;
    const employerAvgRating = reviewsAsEmployer.length > 0
      ? reviewsAsEmployer.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsAsEmployer.length
      : null;
    const overallAvgRating = (reviews || []).length > 0
      ? (reviews || []).reduce((sum, r) => sum + (r.rating || 0), 0) / (reviews || []).length
      : null;

    return {
      profile: {
        id: profile.id,
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        bio: profile.bio,
        photo_url: profile.photo_url,
        roles: profile.roles,
        postcode_area: profile.postcode ? profile.postcode.split(' ')[0] : null,
        rtw_status: profile.rtw_status,
        email_verified: emailVerified,
        created_at: profile.created_at
      },
      worker_stats: workerStats
        ? {
            completed_contracts: workerStats.completed_contracts,
            total_jobs_completed: workerStats.total_jobs_completed,
            reviews: reviewsAsWorker,
            average_rating: workerAvgRating
          }
        : null,
      employer_stats: employerStats
        ? {
            jobs_posted: employerStats.jobs_posted,
            total_jobs_posted: employerStats.total_jobs_posted,
            reviews: reviewsAsEmployer,
            average_rating: employerAvgRating
          }
        : null,
      overall_stats: {
        total_reviews: (reviews || []).length,
        average_rating: overallAvgRating
      }
    };
  } catch (error: any) {
    logDetailedError(error, 'public-profile');
    throw error;
  }
});
