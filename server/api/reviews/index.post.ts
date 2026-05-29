import { serverSupabaseClient } from '#supabase/server';
import { validateCreateReview, ReviewResponseSchema } from '~/schemas/review';
import { logger, logDetailedError } from '~/server/utils/logger';
import { mapReview, reviewSelect } from './utils';
import { getAuthenticatedUser, ensureJobEmployer, ensureApplicationOwner } from '~/server/utils/api';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    const user = await getAuthenticatedUser(event, 'Sign in to submit reviews');

    // Validate request body with Zod
    const validation = validateCreateReview(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;
    const client = await serverSupabaseClient(event);

    // Authorization: Verify the reviewer is a participant in the job
    // Check if user is the employer of the job
    const { data: job } = await client
      .from('jobs')
      .select('employer_id')
      .eq('id', validatedData.job_id)
      .single();

    if (!job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    const isEmployer = job.employer_id === user.id;

    // If not employer, check if user is the worker who applied to this job
    let isWorker = false;
    if (!isEmployer) {
      const { data: application } = await client
        .from('applications')
        .select('worker_id')
        .eq('job_id', validatedData.job_id)
        .eq('worker_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      isWorker = !!application;
    }

    if (!isEmployer && !isWorker) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only review jobs you participated in'
      });
    }

    // Verify the reviewed_user_id is the counterparty
    if (isEmployer) {
      // Employer can only review the worker
      const { data: application } = await client
        .from('applications')
        .select('worker_id')
        .eq('job_id', validatedData.job_id)
        .eq('worker_id', validatedData.reviewed_user_id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!application) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You can only review workers who completed your job'
        });
      }
    } else {
      // Worker can only review the employer
      if (validatedData.reviewed_user_id !== job.employer_id) {
        throw createError({
          statusCode: 403,
          statusMessage: 'You can only review the employer for this job'
        });
      }
    }

    // Check if review already exists
    const { data: existingReview } = await client
      .from('reviews')
      .select('review_id')
      .eq('job_id', validatedData.job_id)
      .eq('reviewer_id', user.id)
      .eq('reviewed_user_id', validatedData.reviewed_user_id)
      .maybeSingle();

    if (existingReview) {
      throw createError({
        statusCode: 409,
        statusMessage: 'You have already reviewed this user for this job'
      });
    }

    const { data, error } = await client
      .from('reviews')
      .insert({
        job_id: validatedData.job_id,
        reviewer_id: user.id,
        reviewed_user_id: validatedData.reviewed_user_id,
        rating: validatedData.rating,
        comment: validatedData.comment ?? null
      })
      .select(reviewSelect)
      .single();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { review: mapReview(data) };
    
    // Validate response with Zod schema
    try {
      return ReviewResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'reviews/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
