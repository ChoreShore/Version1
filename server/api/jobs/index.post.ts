import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateJobInput, JobResponseInput } from '~/schemas/job';
import { validateCreateJob, JobResponseSchema } from '~/schemas/job';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';
import { rateLimiters } from '~/server/utils/rateLimit';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to create jobs'
    );

    // Apply rate limiting based on user ID
    rateLimiters.jobCreation(user.id);

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

    // Check if user has employer role (handle PostgreSQL arrays)
    let hasEmployerRole = false;
    
    if (Array.isArray(profile.roles)) {
      hasEmployerRole = profile.roles.includes('employer');
    } else if (profile.roles && typeof profile.roles === 'string') {
      hasEmployerRole = profile.roles === 'employer';
    } else if (profile.roles && Array.isArray(profile.roles)) {
      // Handle PostgreSQL array format
      hasEmployerRole = profile.roles.some((role: string) => role === 'employer');
    }

    if (!hasEmployerRole) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only employers can create jobs. Add employer role to your profile first.'
      });
    }

    // Validate category exists and is active
    const { data: category } = await client
      .from('job_categories')
      .select('id, is_active')
      .eq('id', body.category_id)
      .single();

    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
    }

    if (category.is_active === false) {
      throw createError({ statusCode: 400, statusMessage: 'Selected category is inactive' });
    }

    // Deduplication: prevent double-submit by checking for an identical job created recently
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recentDuplicate } = await client
      .from('jobs')
      .select('id, title, description, category_id, budget_type, budget_amount, deadline, postcode, created_at')
      .eq('employer_id', user.id)
      .eq('title', body.title)
      .eq('description', body.description)
      .eq('category_id', body.category_id)
      .eq('budget_type', body.budget_type)
      .eq('budget_amount', body.budget_amount)
      .eq('deadline', body.deadline)
      .eq('postcode', body.postcode)
      .gte('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate) {
      // Return the recently created job instead of creating a duplicate
      const { data: existingJob, error: fetchError } = await client
        .from('jobs')
        .select(`
          *,
          employer:profiles!employer_id(first_name, last_name),
          category:job_categories!category_id(name)
        `)
        .eq('id', recentDuplicate.id)
        .single();

      if (!fetchError && existingJob) {
        const response = { job: existingJob };
        try {
          return JobResponseSchema.parse(response);
        } catch (validationError) {
          throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
        }
      }
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
        postcode: body.postcode,
        status: 'open'
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
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});