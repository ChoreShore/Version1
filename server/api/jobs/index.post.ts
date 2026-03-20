import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateJobInput, JobResponseInput } from '~/schemas/job';
import { validateCreateJob, JobResponseSchema } from '~/schemas/job';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to create jobs'
    );

    const body = await readBody<CreateJobInput>(event);
    
    // Use Zod validation alongside existing validation for testing
    const zodValidation = validateCreateJob(body);
    if (!zodValidation.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: zodValidation.errors }
      });
    }
    
    const client = await serverSupabaseClient(event);

    // Check if user has employer role
    const { data: profile } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw createError({ 
        statusCode: 403, 
        statusMessage: 'Profile not found. Please create a profile first.' 
      });
    }

    // Check if user has employer role (handle both string and array formats)
    const hasEmployerRole = Array.isArray(profile.roles) 
      ? profile.roles.includes('employer')
      : profile.roles === 'employer';

    if (!hasEmployerRole) {
      console.error('User roles:', profile.roles);
      console.error('Has employer role:', hasEmployerRole);
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
        title: body.title,
        description: body.description,
        category_id: body.category_id,
        budget_type: body.budget_type,
        budget_amount: body.budget_amount,
        deadline: body.deadline,
        postcode: body.postcode
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