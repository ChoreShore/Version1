import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { UpdateJobPayload, JobResponse } from '~/types/job';
import { validateUpdateJobPayload } from '../../utils/jobValidation';

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
        statusMessage: 'Sign in to update job details' 
      });
    }

    const body = await readBody(event);
    
    const validation = validateUpdateJobPayload(body);
    if (!validation.valid) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: validation.message || 'Validation failed',
        data: { field: validation.field }
      });
    }

    const client = await serverSupabaseClient(event);

    // Check if user is the employer who created this job
    const { data: job } = await client
      .from('jobs')
      .select('employer_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    if (job.employer_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'You can only update your own jobs' });
    }

    // Validate category if provided
    if (body.category_id) {
      const { data: category } = await client
        .from('job_categories')
        .select('id')
        .eq('id', body.category_id)
        .single();

      if (!category) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
      }
    }

    const { data, error } = await client
      .from('jobs')
      .update(body)
      .eq('id', jobId)
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name),
        category:job_categories!category_id(name)
      `)
      .single();

    if (error) {
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