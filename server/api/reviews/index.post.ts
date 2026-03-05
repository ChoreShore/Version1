import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateReviewPayload, ReviewResponse } from '~/types/review';
import { mapReview, reviewSelect } from './utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to leave a review'
      });
    }

    const body = await readBody<CreateReviewPayload>(event);

    if (!body.job_id) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    if (!body.reviewed_user_id) {
      throw createError({ statusCode: 400, statusMessage: 'Reviewed user ID is required' });
    }

    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw createError({ statusCode: 400, statusMessage: 'Rating must be between 1 and 5' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('reviews')
      .insert({
        job_id: body.job_id,
        reviewer_id: user.id,
        reviewed_user_id: body.reviewed_user_id,
        rating: body.rating,
        comment: body.comment ?? null
      })
      .select(reviewSelect)
      .single();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { review: mapReview(data) } satisfies ReviewResponse;
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
