import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
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
    logger.error('API Response validation failed', validationError, 'jobs/categories.get');
    throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
  }
});