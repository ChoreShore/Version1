import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { ReviewsResponseSchema } from '~/schemas/review';
import { mapReview, reviewSelect } from './utils';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view reviews');

    const query = getQuery(event);
    const type = (query.type as 'given' | 'received') ?? 'received';
    const client = await serverSupabaseClient(event);

    const column = type === 'given' ? 'reviewer_id' : 'reviewed_user_id';

    const { data, error } = await client
      .from('reviews')
      .select(reviewSelect)
      .eq(column, user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const reviews = (data ?? []).map(mapReview);

    const response = { reviews: data?.map(mapReview) || [] };
    
    // Validate response with Zod schema
    try {
      return ReviewsResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'reviews/index.get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
