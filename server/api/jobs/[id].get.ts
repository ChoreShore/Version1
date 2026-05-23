import { serverSupabaseClient } from '#supabase/server';
import { JobResponseSchema } from '~/schemas/job';
import { logger } from '~/server/utils/logger';
import { assertValidUuid, getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view full job details');
    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

    const client = await serverSupabaseClient(event);

    // Fetch job first to determine ownership (minimal select)
    const { data: job, error } = await client
      .from('jobs')
      .select('employer_id, status')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    const isOwner = job.employer_id === user.id;

    // Non-owners can only view OPEN jobs
    if (!isOwner && job.status !== 'open') {
      throw createError({ statusCode: 403, statusMessage: 'This job is not available' });
    }

    // Build selective query based on ownership
    let select = `*, category:job_categories!category_id(name)`;
    if (isOwner) {
      select += `, employer:profiles!employer_id(first_name, last_name)`;
    } else {
      select += `, employer:profiles!employer_id(first_name, last_name)`;
    }

    const { data: jobData, error: jobError } = await client
      .from('jobs')
      .select(select)
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    // Application count only for owner
    let applicationCount = 0;
    if (isOwner) {
      const { count } = await client
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);
      applicationCount = count ?? 0;
    }

    const response = { job: { ...jobData, application_count: applicationCount } };

    // Validate response with Zod schema
    try {
      return JobResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'jobs/[id].get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});