import { serverSupabaseClient } from '#supabase/server';
import { ApplicationResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser, ensureApplicationOwner, ensureJobEmployer } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const user = await getAuthenticatedUser(event, 'Sign in to view application details');

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!applicationId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

    const client = await serverSupabaseClient(event);

    // Authorization check: user must either be the application owner (worker) or the job employer
    // First check if user is the worker
    try {
      await ensureApplicationOwner(client, applicationId, user.id);
    } catch (error) {
      // If not the worker, check if they're the job employer
      const { data: application } = await client
        .from('applications')
        .select('job_id')
        .eq('id', applicationId)
        .single();
      
      if (application) {
        await ensureJobEmployer(client, application.job_id, user.id);
      } else {
        throw error;
      }
    }

    const { data, error } = await client
      .from('applications')
      .select(`
        *,
        job:jobs(id, title, description, employer_id)
      `)
      .eq('id', applicationId)
      .single();
    
    if (!error && data) {
      // Fetch worker details
      const { data: worker } = await client
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', data.worker_id)
        .single();
      
      // Fetch employer details
      const { data: employer } = await client
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', data.job.employer_id)
        .single();
      
      // Add formatted names and IDs to the response
      data.job_title = data.job?.title;
      data.employer_id = data.job?.employer_id;
      data.worker_name = worker ? `${worker.first_name} ${worker.last_name}` : null;
      data.employer_name = employer ? `${employer.first_name} ${employer.last_name}` : null;
    }

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Application not found' });
      }
      
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { application: data };
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    throw error;
  }
});
