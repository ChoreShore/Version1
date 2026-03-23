import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationResponseSchema } from '~/schemas/application';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view application details' 
      });
    }

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!applicationId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

    const client = await serverSupabaseClient(event);

    // RLS will handle authorization:
    // - Workers can view their own applications
    // - Employers can view applications for their jobs

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
      
      // Check if it's an RLS policy violation
      if (error.code === '42501') {
        throw createError({ 
          statusCode: 403, 
          statusMessage: 'You can only view applications you have permission to see' 
        });
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
    // Handle Supabase client initialization errors
    if (error.message?.includes('Auth session missing') || 
        error.message?.includes('Supabase') ||
        error.message?.includes('session') ||
        error.message?.includes('authentication') ||
        error.statusCode === 500 ||
        error.statusCode === 401) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Auth session missing!' 
      });
    }
    throw error;
  }
});
