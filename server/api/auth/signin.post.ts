import type { SignInPayload } from '~/types/auth';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SignInPayload>(event);
    const client = await serverSupabaseClient(event);

    const { data, error } = await client.auth.signInWithPassword(body);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { user: data.user, session: data.session };
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
