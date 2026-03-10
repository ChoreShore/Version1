import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { UpdateJobInput, JobResponseSchema, validateUpdateJob } from '~/schemas/job';
import { assertValidUuid, ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to update job details'
    );
    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

    const body = await readBody(event);
    
    const validation = validateUpdateJob(body);
    if (!validation.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
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

    const response = { job: data };
    
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