import { serverSupabaseClient } from '#supabase/server';
import { ApplicationWithDetailsSchema, ApplicationsResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser, ensureJobEmployer } from '~/server/utils/api';

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
    await ensureJobEmployer(client, jobId, user.id);

    // Get applications for this job with worker and job details
    const { data, error } = await client
      .from('applications')
      .select(`
        *,
        worker:profiles!worker_id(first_name, last_name, phone),
        job:jobs(budget_amount, budget_type)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Transform data to include missing required fields
    const applications = (data || []).map(app => {
      const { job, worker, ...appData } = app;
      return {
        ...appData,
        job_id: jobId, // Add missing job_id field
        updated_at: app.created_at, // Add missing updated_at field (same as created_at for now)
        job_budget_amount: job?.budget_amount,
        job_budget_type: job?.budget_type,
        worker_first_name: worker?.first_name,
        worker_last_name: worker?.last_name,
        worker_phone: worker?.phone
      };
    });

    const response = { applications };
    
    // Validate response with Zod schema
    try {
      return ApplicationsResponseSchema.parse({
        applications: applications.map(app => ApplicationWithDetailsSchema.parse(app))
      });
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    throw error;
  }
});
