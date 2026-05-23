import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { ReviewsResponseSchema } from '~/schemas/review';
import { mapReview, reviewSelect } from '../utils';

export default defineEventHandler(async (event) => {
  try {
    const workerId = getRouterParam(event, 'id');

    if (!workerId) {
      throw createError({ statusCode: 400, statusMessage: 'Worker ID is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workerId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid worker ID format' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('reviews')
      .select(reviewSelect)
      .eq('reviewed_user_id', workerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { reviews: data?.map(mapReview) || [] };
    
    // Validate response with Zod schema
    try {
      return ReviewsResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'reviews/worker/[id].get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
