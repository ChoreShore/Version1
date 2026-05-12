import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateJobInput, JobResponseInput } from '~/schemas/job';
import { validateCreateJob, JobResponseSchema } from '~/schemas/job';
import { ensureAuthenticated, rethrowIfAuthError } from '~/server/utils/api';
import { rateLimiters } from '~/server/utils/rateLimit';
import { geocodePostcode } from '~/server/utils/geocoding';
import { hasRole } from '~/server/utils/roles';

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

    if (!hasRole(profile.roles, 'employer')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only employers can create jobs. Add employer role to your profile first.'
      });
    }

    // Validate category exists
    const { data: category, error: categoryError } = await client
      .from('job_categories')
      .select('id')
      .eq('id', body.category_id)
      .single();

    if (categoryError) {
      console.error('Category query failed:', categoryError);
      throw createError({ statusCode: 500, statusMessage: 'Failed to query category' });
    }

    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
    }

    // Deduplication: prevent double-submit by checking for an identical job created recently
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recentDuplicate } = await client
      .from('jobs')
      .select('id')
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
          console.error('Response validation failed:', validationError);
          throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
        }
      }
    }

    // Geocode postcode to coordinates
    let latitude: number | null = null;
    let longitude: number | null = null;

    const geocodingResult = await geocodePostcode(body.postcode);
    if (geocodingResult.success && geocodingResult.latitude && geocodingResult.longitude) {
      latitude = geocodingResult.latitude;
      longitude = geocodingResult.longitude;
    } else {
      console.warn(`Failed to geocode postcode: ${body.postcode}`, geocodingResult.error);
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
        latitude,
        longitude,
        status: 'open'
      })
      .select(`
        *,
        employer:profiles!employer_id(first_name, last_name),
        category:job_categories!category_id(name)
      `)
      .single();

    if (error) {
      console.error('Job creation failed:', error);
      throw createError({ statusCode: 500, statusMessage: 'Failed to create job' });
    }

    const response = { job: data };
    
    // Validate response with Zod schema
    try {
      return JobResponseSchema.parse(response);
    } catch (validationError) {
      console.error('Response validation failed:', validationError);
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    rethrowIfAuthError(error);
    throw error;
  }
});