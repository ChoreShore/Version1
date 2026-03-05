import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateJobPayload, JobResponse } from '~/types/job';
import { validateCreateJobPayload } from '../../utils/jobValidation';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to create jobs'
    );

    const body = await readBody<CreateJobPayload>(event);
    
    const validation = validateCreateJobPayload(body);
    if (!validation.valid) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: validation.message || 'Validation failed',
        data: { field: validation.field }
      });
    }

    const client = await serverSupabaseClient(event);

    // Check if user has employer role
    const { data: profile } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.roles.includes('employer')) {
      throw createError({ 
        statusCode: 403, 
        statusMessage: 'Only employers can create jobs. Add employer role to your profile first.' 
      });
    }

    // Validate category exists
    const { data: category } = await client
      .from('job_categories')
      .select('id')
      .eq('id', body.category_id)
      .single();

    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
    }

    const { data, error } = await client
      .from('jobs')
      .insert({
        employer_id: user.id,
        ...body
      })
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
    handleSupabaseAuthErrors(error);
    throw error;
  }
});