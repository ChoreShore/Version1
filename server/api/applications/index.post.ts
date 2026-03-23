import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateCreateApplication, ApplicationResponseSchema } from '~/schemas/application';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to apply to jobs' 
      });
    }

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

    // Debug: Check job details
    const { data: jobData } = await client
      .from('jobs')
      .select('id, status, employer_id')
      .eq('id', validatedData.job_id)
      .single();

    // Debug: Check user profile
    const { data: profileData } = await client
      .from('profiles')
      .select('id, roles')
      .eq('id', user.id)
      .single();

    // Debug: Check existing application
    const { data: existingApp } = await client
      .from('applications')
      .select('id')
      .eq('job_id', validatedData.job_id)
      .eq('worker_id', user.id)
      .maybeSingle();

    // Build detailed error message
    let debugInfo = [];
    if (!jobData) debugInfo.push('Job not found');
    else if (jobData.status !== 'open') debugInfo.push(`Job status is '${jobData.status}', not 'open'`);
    else if (jobData.employer_id === user.id) debugInfo.push('You cannot apply to your own job');
    
    if (existingApp) debugInfo.push('You have already applied to this job');
    
    if (!profileData?.roles?.includes('worker')) {
      debugInfo.push(`Your roles: [${profileData?.roles?.join(', ') || 'none'}]. Need 'worker' role.`);
    }

    if (debugInfo.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot apply: ${debugInfo.join('; ')}`
      });
    }

    // Use your existing can_apply_to_job function
    const { data: canApply, error: canApplyError } = await client.rpc('can_apply_to_job', {
      job_uuid: validatedData.job_id,
      worker_uuid: user.id
    });

    if (canApplyError) {
      throw createError({ statusCode: 400, statusMessage: canApplyError.message });
    }

    if (!canApply) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot apply to this job. The job may not be open, you may have already applied, or you may not have the worker role.'
      });
    }

    const { data, error } = await client
      .from('applications')
      .insert({
        job_id: validatedData.job_id,
        worker_id: user.id,
        cover_letter: validatedData.cover_letter || null,
        proposed_rate: validatedData.proposed_rate || null
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (already applied)
      if (error.code === '23505') {
        throw createError({ 
          statusCode: 400, 
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

    const response = { application: data };
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
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
