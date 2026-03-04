import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { JobResponse } from '~/types/job';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    const jobId = getRouterParam(event, 'id');

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Validate job ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view full job details' 
      });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('jobs')
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name, phone),
        category:job_categories!category_id(name)
      `)
      .eq('id', jobId)
      .single();

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Job not found' });
      }
      
      // Check if it's an RLS policy violation (trying to access other's jobs)
      if (error.code === '42501') {
        throw createError({ statusCode: 403, statusMessage: 'You can only view your own job details' });
      }
      
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response: JobResponse = { job: data };
    return response;
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