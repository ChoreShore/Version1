import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateCreateReview, ReviewResponseSchema } from '~/schemas/review';
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

    const body = await readBody(event);

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
