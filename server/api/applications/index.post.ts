import { serverSupabaseClient } from '#supabase/server';
import { validateCreateApplication, ApplicationResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser } from '~/server/utils/api';
import { logger } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';
import { sendNotificationEmail } from '~/server/utils/email';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);
    const user = await getAuthenticatedUser(event, 'Sign in to apply to jobs');

    // Apply rate limiting based on user ID
    await rateLimiters.applications(user.id);

    // Validate request body with Zod
    const validation = validateCreateApplication(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;
    const client = await serverSupabaseClient(event);

    // Fetch job details for validation
    const { data: jobData } = await client
      .from('jobs')
      .select('id, title, status, employer_id, deadline')
      .eq('id', validatedData.job_id)
      .single();

    // Fetch user profile for role validation
    const { data: profileData } = await client
      .from('profiles')
      .select('id, roles, first_name, last_name')
      .eq('id', user.id)
      .single();

    // Check for existing application
    const { data: existingApp } = await client
      .from('applications')
      .select('id, status')
      .eq('job_id', validatedData.job_id)
      .eq('worker_id', user.id)
      .maybeSingle();

    // Build validation errors
    let validationErrors = [];
    if (!jobData) validationErrors.push('Job not found');
    else if (jobData.status !== 'open') validationErrors.push(`Job status is '${jobData.status}', not 'open'`);
    else if (new Date(jobData.deadline) < new Date()) validationErrors.push('Job deadline has passed');
    else if (jobData.employer_id === user.id) validationErrors.push('You cannot apply to your own job');
    
    if (existingApp && existingApp.status !== 'withdrawn') validationErrors.push('You have already applied to this job');
    
    if (!profileData?.roles?.includes('worker')) {
      validationErrors.push(`Your roles: [${profileData?.roles?.join(', ') || 'none'}]. Need 'worker' role.`);
    }

    if (validationErrors.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot apply: ${validationErrors.join('; ')}`
      });
    }

    // All validation checks passed, proceed with application creation using upsert
    // This prevents race conditions with database-level unique constraint
    const { data, error } = await client
      .from('applications')
      .upsert({
        job_id: validatedData.job_id,
        worker_id: user.id,
        cover_letter: validatedData.cover_letter || null,
        proposed_rate: validatedData.proposed_rate || null,
        status: 'pending',
        withdrawal_reason: null
      }, {
        onConflict: 'job_id,worker_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (already applied)
      if (error.code === '23505') {
        throw createError({
          statusCode: 409,
          statusMessage: 'You have already applied to this job'
        });
      }
      
      // Check for foreign key constraint violation (job doesn't exist)
      if (error.code === '23503') {
        throw createError({ 
          statusCode: 400, 
          statusMessage: 'Job not found' 
        });
      }
      
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Notify job poster of new application (fire-and-forget, never blocks response)
    if (jobData?.employer_id) {
      const applicantName = [profileData?.first_name, profileData?.last_name].filter(Boolean).join(' ') || 'Someone';
      sendNotificationEmail(event, {
        userId: jobData.employer_id,
        subject: `New application for "${jobData.title}"`,
        html: `<p>Hi there,</p><p><strong>${applicantName}</strong> has applied to your job "<strong>${jobData.title}</strong>".</p><p>Log in to your dashboard to review their application.</p>`,
        idempotencyKey: `application-submitted/${data.id}`
      }).catch(() => {});
    }

    const response = { application: data };
    
    // Validate response with Zod schema
    try {
      return ApplicationResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'applications/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
