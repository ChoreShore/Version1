import { serverSupabaseClient } from '#supabase/server';
import { getRequestIP } from 'h3';
import { rateLimiters } from '~/server/utils/rateLimit';
import { logDetailedError } from '~/server/utils/logger';

const userReviewSelect = `
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

function mapUserReview(raw: any) {
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
    const userId = getRouterParam(event, 'id');
    if (!userId) {
      throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid user ID format' });
    }

    const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
    await rateLimiters.general(clientIp, event);

    const client = await serverSupabaseClient(event);

    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select(userReviewSelect)
      .eq('reviewed_user_id', userId)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      logDetailedError(reviewsError, 'user-reviews-fetch');
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch reviews' });
    }

    // Fetch context: jobs + contracts to determine role
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

    const reviewsAsWorker: any[] = [];
    const reviewsAsEmployer: any[] = [];

    for (const review of (reviews || [])) {
      const ctx = reviewContext.get(review.job_id);
      const mapped = mapUserReview(review);

      if (review.reviewed_user_id === ctx?.employer_id) {
        reviewsAsEmployer.push(mapped);
      } else if (review.reviewed_user_id === ctx?.worker_id) {
        reviewsAsWorker.push(mapped);
      } else {
        reviewsAsWorker.push(mapped);
      }
    }

    const workerAvgRating = reviewsAsWorker.length > 0
      ? reviewsAsWorker.reduce((sum, r) => sum + r.rating, 0) / reviewsAsWorker.length
      : null;
    const employerAvgRating = reviewsAsEmployer.length > 0
      ? reviewsAsEmployer.reduce((sum, r) => sum + r.rating, 0) / reviewsAsEmployer.length
      : null;
    const overallAvgRating = (reviews || []).length > 0
      ? (reviews || []).reduce((sum, r) => sum + r.rating, 0) / (reviews || []).length
      : null;

    return {
      user_id: userId,
      reviews: {
        as_worker: reviewsAsWorker,
        as_employer: reviewsAsEmployer,
        all: [...reviewsAsWorker, ...reviewsAsEmployer].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      },
      average_ratings: {
        as_worker: workerAvgRating,
        as_employer: employerAvgRating,
        overall: overallAvgRating
      }
    };
  } catch (error: any) {
    logDetailedError(error, 'user-reviews');
    throw error;
  }
});
