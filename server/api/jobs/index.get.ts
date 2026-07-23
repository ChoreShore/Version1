import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { getRequestIP } from 'h3';
import type { JobsQueryInput } from '~/schemas/job';
import { JobsResponseSchema } from '~/schemas/job';
import { fetchPreviewJobs } from '~/server/utils/preview';
import { rateLimiters } from '~/server/utils/rateLimit';
import { hasRole } from '~/server/utils/roles';
import { JOB_SELECT_WITH_RELATIONS } from '~/server/utils/queries';

export default defineEventHandler(async (event) => {
  try {
    logger.debug('Starting request', 'jobs/index.get');
    const user = await serverSupabaseUser(event);
    logger.debug('User:', 'jobs/index.get', user?.id ?? 'anonymous');
    const client = await serverSupabaseClient(event);
    const query = getQuery(event) as JobsQueryInput & { role?: string; scope?: string };

    if (!user) {
      // Rate limit public job browsing to prevent scraping
      const clientIp = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
      await rateLimiters.general(clientIp, event);

      logger.debug('No user, fetching preview jobs', 'jobs/index.get');
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
      .select(JOB_SELECT_WITH_RELATIONS)
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

    // Fetch application counts in a single batched query
    const jobIds = (data || []).map((job: any) => job.id);
    const { data: counts } = await client
      .from('applications')
      .select('job_id')
      .in('job_id', jobIds);

    const countMap = new Map<string, number>();
    for (const row of counts || []) {
      const id = (row as any).job_id;
      countMap.set(id, (countMap.get(id) || 0) + 1);
    }

    const jobsWithCounts = (data || []).map((job: any) => ({
      ...job,
      application_count: countMap.get(job.id) ?? 0
    }));

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
    logger.error('Request failed', error, 'jobs/index.get');
    throw error;
  }
});