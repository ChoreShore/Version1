import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { ApplicationsResponse } from '~/types/application';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view your applications' 
      });
    }

    const client = await serverSupabaseClient(event);

    // Use your existing get_worker_applications function
    const { data, error } = await client.rpc('get_worker_applications', {
      worker_uuid: user.id
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { applications: data || [] } as ApplicationsResponse;
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
