import { serverSupabaseClient } from '#supabase/server';
import type { CreateJobInput } from '~/schemas/job';
import { validateCreateJob, JobResponseSchema } from '~/schemas/job';
import { getAuthenticatedUser } from '~/server/utils/api';
import { hasRole } from '~/server/utils/roles';
import { geocodePostcode } from '~/server/utils/geocoding';
import { logger, logDetailedError } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const user = await getAuthenticatedUser(event, 'Sign in to create jobs');

    // Apply rate limiting based on user ID
    await rateLimiters.jobCreation(user.id);

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
      logger.error('Category query failed', categoryError, 'jobs/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Failed to query category' });
    }

    if (!category) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid category ID' });
    }

    // Deduplication: prevent double-submit by checking for an identical job created recently
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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
      .eq('estimated_hours', body.estimated_hours)
      .eq('is_recurring', body.is_recurring)
      .gte('created_at', fiveMinutesAgo)
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

      if (fetchError) {
        logger.error('Failed to fetch existing job for deduplication', fetchError, 'jobs/index.post');
        // Continue to create the job anyway since we can't confirm if a duplicate exists
      } else if (existingJob) {
        const response = { job: existingJob };
        try {
          return JobResponseSchema.parse(response);
        } catch (validationError) {
          logger.error('Response validation failed', validationError, 'jobs/index.post');
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
      logger.warn(`Failed to geocode postcode: ${body.postcode}`, undefined, 'jobs/index.post', geocodingResult.error);
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
        estimated_hours: body.estimated_hours,
        is_recurring: body.is_recurring,
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
      logger.error('Job creation failed', error, 'jobs/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Failed to create job' });
    }

    const response = { job: data };
    
    // Validate response with Zod schema
    try {
      return JobResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'jobs/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});