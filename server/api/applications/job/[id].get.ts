import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { ApplicationWithDetailsSchema, ApplicationsResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser, ensureJobOwner } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const jobId = getRouterParam(event, 'id');
    const user = await getAuthenticatedUser(event, 'Sign in to view applications');

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!jobId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    const client = await serverSupabaseClient(event);

    // Authorization check: only the job employer can view applications for their job
    await ensureJobOwner(client, jobId, user.id);

    // Get applications for this job with worker and job details
    const { data, error } = await client
      .from('applications')
      .select(`
        *,
        worker:profiles!worker_id(username, first_name, last_name, bio),
        job:jobs(budget_amount, budget_type)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Transform data to include missing required fields
    const applications = data?.map(app => {
      const { job, worker, ...appData } = app;
      return {
        ...appData,
        job_title: job?.title,
        job_budget_amount: job?.budget_amount,
        job_budget_type: job?.budget_type,
        worker_first_name: worker?.first_name,
        worker_last_name: worker?.last_name,
        worker_name: worker ? `${worker.first_name} ${worker.last_name}` : null,
        worker_username: worker?.username || null,
        worker_bio: worker?.bio || null
      };
    }) || [];

    const response = { applications };
    
    // Validate response with Zod schema
    try {
      return ApplicationsResponseSchema.parse({
        applications: applications.map(app => ApplicationWithDetailsSchema.parse(app))
      });
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'applications/job/[id].get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
