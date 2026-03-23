import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationWithDetailsSchema, ApplicationsResponseSchema } from '~/schemas/application';

export default defineEventHandler(async (event) => {
  try {
    const jobId = getRouterParam(event, 'id');
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view applications' 
      });
    }

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!jobId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    const client = await serverSupabaseClient(event);

    // Get applications for this job with worker details
    const { data, error } = await client
      .from('applications')
      .select(`
        *,
        worker:profiles!worker_id(first_name, last_name, phone)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Transform data to include missing required fields
    const applications = (data || []).map(app => ({
      ...app,
      job_id: jobId, // Add missing job_id field
      updated_at: app.created_at // Add missing updated_at field (same as created_at for now)
    }));

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
