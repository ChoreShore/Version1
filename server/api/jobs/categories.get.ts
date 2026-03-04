import { serverSupabaseClient } from '#supabase/server';
import type { CategoriesResponse } from '~/types/job';

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event);

  const { data, error } = await client
    .from('job_categories')
    .select('*')
    .order('name');

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  const response: CategoriesResponse = { categories: data || [] };
  return response;
});