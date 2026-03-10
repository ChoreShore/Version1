import { PasswordResetSchema } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validate request body with Zod
    const validation = PasswordResetSchema.safeParse(body);
    if (!validation.success) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Invalid email address'
      });
    }

    const client = await serverSupabaseClient(event);
    const { error } = await client.auth.resetPasswordForEmail(validation.data.email, {
      redirectTo: `${getRequestURL(event).origin}/auth/reset`
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { success: true };
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
