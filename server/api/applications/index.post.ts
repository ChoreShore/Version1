import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateApplicationPayload, ApplicationResponse } from '~/types/application';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as CreateApplicationPayload;
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to apply to jobs' 
      });
    }

    // Validate required fields
    if (!body.job_id) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Validate job ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(body.job_id)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    const client = await serverSupabaseClient(event);

    // Use your existing can_apply_to_job function
    const { data: canApply, error: canApplyError } = await client.rpc('can_apply_to_job', {
      job_uuid: body.job_id,
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
        job_id: body.job_id,
        worker_id: user.id,
        cover_letter: body.cover_letter || null,
        proposed_rate: body.proposed_rate || null,
        availability_notes: body.availability_notes || null
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

    return { application: data } as ApplicationResponse;
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
