import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationStatsResponseSchema } from '~/schemas/application';

export default defineEventHandler(async (event) => {
  try {
    const jobId = getRouterParam(event, 'id');
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view application statistics' 
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

    // Use your existing get_job_application_stats function
    const { data, error } = await client.rpc('get_job_application_stats', {
      job_uuid: jobId
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // RLS will handle authorization - only employers can view stats for their jobs
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationStatsResponseSchema.parse(data);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return data;
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
