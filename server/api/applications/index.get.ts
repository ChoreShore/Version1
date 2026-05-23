import { serverSupabaseClient } from '#supabase/server';
import { ApplicationsResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser } from '~/server/utils/api';
import { hasRole } from '~/server/utils/roles';
import { logger } from '~/server/utils/logger';

export default defineEventHandler(async (event) => {
  try {
    logger.debug('Starting request', 'applications/index.get');
    const user = await getAuthenticatedUser(event, 'Sign in to view your applications');
    logger.debug('User authenticated', 'applications/index.get', user.id);
    const client = await serverSupabaseClient(event);

    // Resolve actual role from the user's profile — never trust query.role for authorization
    const { data: profile } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    const isEmployer = hasRole(profile?.roles, 'employer');

    let data, error;

    if (isEmployer) {
      // Get applications for jobs posted by this employer using direct query
      const result = await client
        .from('applications')
        .select(`
          *,
          job:jobs!inner(title, employer_id, budget_amount, budget_type),
          worker:profiles!worker_id(username, first_name, last_name, bio)
        `)
        .eq('jobs.employer_id', user.id)
        .order('created_at', { ascending: false });
      
      data = result.data?.map(app => {
        const { job, worker, ...appData } = app;
        return {
          ...appData,
          job_title: job?.title,
          job_budget_amount: job?.budget_amount,
          job_budget_type: job?.budget_type,
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : null,
          worker_username: worker?.username || null,
          worker_bio: worker?.bio || null
        };
      });
      error = result.error;
    } else {
      // Default: get applications submitted by this worker
      const result = await client
        .from('applications')
        .select(`
          *,
          job:jobs(title, employer_id, budget_amount, budget_type, employer:profiles!jobs_employer_id_fkey(first_name, last_name))
        `)
        .eq('worker_id', user.id)
        .order('created_at', { ascending: false });
      
      data = result.data?.map(app => {
        const { job, ...appData } = app;
        return {
          ...appData,
          job_title: job?.title,
          job_budget_amount: job?.budget_amount,
          job_budget_type: job?.budget_type,
          employer_name: job?.employer ? `${job.employer.first_name} ${job.employer.last_name}` : null
        };
      });
      error = result.error;
    }

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { applications: data || [] };
    
    // Validate response with Zod schema
    try {
      return ApplicationsResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'applications/index.get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    logger.error('Request failed', error, 'applications/index.get');
    throw error;
  }
});
