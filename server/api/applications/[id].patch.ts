import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { UpdateApplicationPayload, ApplicationResponse } from '~/types/application';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const body = await readBody(event) as UpdateApplicationPayload;
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to update applications' 
      });
    }

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    // Validate application ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(applicationId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'withdrawn'];
    if (!body.status || !validStatuses.includes(body.status)) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Valid status is required: pending, accepted, rejected, or withdrawn' 
      });
    }

    const client = await serverSupabaseClient(event);

    // RLS will handle authorization:
    // - Employers can accept/reject (status: accepted/rejected)
    // - Workers can withdraw (status: withdrawn)

    const { data, error } = await client
      .from('applications')
      .update({
        status: body.status
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Application not found' });
      }
      
      // Check if it's an RLS policy violation
      if (error.code === '42501') {
        throw createError({ 
          statusCode: 403, 
          statusMessage: 'You can only update applications you have permission to manage' 
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
