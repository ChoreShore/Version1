import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { JobsQueryInput } from '~/schemas/job';
import { JobsResponseSchema, JobsQuerySchema } from '~/schemas/job';
import { fetchPreviewJobs } from '~/server/utils/preview';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

function hasEmployerRole(roles: unknown): boolean {
  if (Array.isArray(roles)) {
    return roles.includes('employer');
  }
  if (typeof roles === 'string') {
    return roles === 'employer' || roles.split(',').map(r => r.trim()).includes('employer');
  }
  return false;
}

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

    const isEmployer = hasEmployerRole(profile?.roles);

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

    // Role-based filtering — based on server-resolved role, not client-supplied query.role
    if (isEmployer && query.scope === 'mine') {
      // Show only jobs posted by this employer
      builder = builder.eq('employer_id', user.id);
    } else {
      // For authenticated workers or employers in "browse" mode: show open jobs from other users
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
    handleSupabaseAuthErrors(error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({ statusCode: 400, statusMessage: error.message });
  }
});