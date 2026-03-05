import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { JobsQuery, JobsResponse } from '~/types/job';
import { fetchPreviewJobs } from '~/server/utils/preview';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    const client = await serverSupabaseClient(event);
    const query = getQuery(event) as JobsQuery;

    if (!user) {
      return await fetchPreviewJobs(client, query);
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    let builder = client
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name),
        category:job_categories!category_id(name)
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (query.category) {
      builder = builder.eq('category_id', query.category);
    }

    if (query.postcode) {
      builder = builder.like('postcode', `${query.postcode}%`);
    }

    const { data, error } = await builder;

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return {
      jobs: data || [],
      preview_mode: false
    } satisfies JobsResponse;
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

    if (error.statusCode) {
      throw error;
    }

    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});