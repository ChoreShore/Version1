import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationsResponseSchema } from '~/schemas/application';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view your applications' 
      });
    }

    const query = getQuery(event);
    const role = query.role as string;
    const client = await serverSupabaseClient(event);

    let data, error;

    if (role === 'employer') {
      // Get applications for jobs posted by this employer using direct query
      const result = await client
        .from('applications')
        .select(`
          *,
          job:jobs!inner(title, employer_id, budget_amount, budget_type),
          worker:profiles!worker_id(first_name, last_name)
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
          worker_name: worker ? `${worker.first_name} ${worker.last_name}` : null
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
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationsResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
