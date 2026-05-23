import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { ReviewResponseSchema } from '~/schemas/review';
import { mapReview, reviewSelect } from '../utils';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view reviews');

    const jobId = getRouterParam(event, 'id');

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('reviews')
      .select(reviewSelect)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    if (!data) {
      throw createError({ statusCode: 404, statusMessage: 'Review not found' });
    }

    const response = { review: mapReview(data) };
    
    // Validate response with Zod schema
    try {
      return ReviewResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'reviews/job/[id].get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
