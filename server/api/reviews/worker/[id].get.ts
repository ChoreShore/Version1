import { serverSupabaseClient } from '#supabase/server';
import type { ReviewsResponse } from '~/types/review';
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

    return { reviews: (data ?? []).map(mapReview) } satisfies ReviewsResponse;
  } catch (error: any) {
    if (
      error.message?.includes('Auth session missing') ||
      error.message?.includes('Supabase') ||
      error.message?.includes('session') ||
      error.message?.includes('authentication') ||
      error.statusCode === 500 ||
      error.statusCode === 401
    ) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Auth session missing!'
      });
    }
    throw error;
  }
});
