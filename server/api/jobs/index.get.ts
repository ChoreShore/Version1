import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { JobsQueryInput } from '~/schemas/job';
import { JobsResponseSchema, JobsQuerySchema } from '~/schemas/job';
import { fetchPreviewJobs } from '~/server/utils/preview';
import { rethrowIfAuthError } from '~/server/utils/api';
import { hasRole } from '~/server/utils/roles';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    const client = await serverSupabaseClient(event);
    const query = getQuery(event) as JobsQueryInput & { role?: string; scope?: string };

    if (!user) {
      return await fetchPreviewJobs(client, query);
    }

    // Resolve actual role from the user's profile — never trust query.role for authorization
    const { data: profile } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    const isEmployer = hasRole(profile?.roles, 'employer');

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

    // Scope filtering
    // If client requests personal scope, always return only the caller's jobs.
    if (query.scope === 'mine') {
      builder = builder.eq('employer_id', user.id);
    } else if (isEmployer) {
      // Employers default to their own jobs
      builder = builder.eq('employer_id', user.id);
    } else {
      // Workers see open jobs from other employers
      builder = builder
        .eq('status', 'open')
        .neq('employer_id', user.id);
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

    // Fetch application counts for each job
    const jobsWithCounts = await Promise.all(
      (data || []).map(async (job: any) => {
        const { count } = await client
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);
        
        return {
          ...job,
          application_count: count ?? 0
        };
      })
    );

    // Validate response with Zod schema
    const response = {
      jobs: jobsWithCounts,
      preview_mode: false
    };

    try {
      return JobsResponseSchema.parse(response);
    } catch (validationError) {
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    rethrowIfAuthError(error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});