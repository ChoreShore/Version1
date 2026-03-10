import { serverSupabaseClient } from '#supabase/server';
import { CategoriesResponseSchema } from '~/schemas/job';

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  const { data, error } = await client
    .from('job_categories')
    .select('*')
    .order('name');

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const response = { categories: data || [] };

  // Validate response with Zod schema
  try {
    return CategoriesResponseSchema.parse(response);
  } catch (validationError) {
    console.error('API Response validation failed:', validationError);
    throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
  }
});