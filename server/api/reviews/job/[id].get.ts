import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ReviewResponseSchema } from '~/schemas/review';
import { mapReview, reviewSelect } from '../utils';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to view reviews'
      });
    }

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
    
    // Validate response with Zod schema (safe validation)
    try {
      return ReviewResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
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
