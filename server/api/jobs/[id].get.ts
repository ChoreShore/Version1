import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { JobResponseSchema } from '~/schemas/job';
import { assertValidUuid, ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to view full job details'
    );
    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

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

    // Fetch application count for this job
    const { count } = await client
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    const response = { job: { ...data, application_count: count ?? 0 } };
    
    // Validate response with Zod schema
    try {
      return JobResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});