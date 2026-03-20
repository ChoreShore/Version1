import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { JobsQueryInput } from '~/schemas/job';
import { JobsResponseSchema, JobsQuerySchema } from '~/schemas/job';
import { fetchPreviewJobs } from '~/server/utils/preview';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    const client = await serverSupabaseClient(event);
    const query = getQuery(event) as JobsQueryInput & { role?: string; scope?: string };

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
      .order('created_at', { ascending: false })
      .limit(limit);

    // Role-based filtering
    if (query.role === 'employer' && query.scope === 'mine') {
      // Show only jobs posted by this employer
      builder = builder.eq('employer_id', user.id);
    } else if (query.role === 'worker') {
      // Show only open jobs from other employers for workers
      builder = builder
        .eq('status', 'open')
        .neq('employer_id', user.id);
    } else {
      // Default: show open jobs
      builder = builder.eq('status', 'open');
    }

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

    // Validate response with Zod schema
    const response = {
      jobs: data || [],
      preview_mode: false
    };

    try {
      return JobsResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});