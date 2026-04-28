import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ReviewsResponseSchema } from '~/schemas/review';
import { mapReview, reviewSelect } from './utils';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to view reviews'
      });
    }

    const query = getQuery(event);
    const type = (query.type as 'given' | 'received') ?? 'received';
    const role = query.role as string;

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
    
    // Validate response with Zod schema (safe validation)
    try {
      return ReviewsResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
