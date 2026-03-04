import type { SignUpPayload } from '~/types/auth';
import { serverSupabaseClient } from '#supabase/server';
import { validatePassword } from '~/server/utils/validatePassword';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SignUpPayload>(event);

    if (!body.email || !body.password || !body.first_name || !body.last_name || !body.phone || !body.role) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'All fields are required: email, password, first_name, last_name, phone, role' 
      });
    }

    const passwordValidation = validatePassword(body.password);
    if (!passwordValidation.valid) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: passwordValidation.message 
      });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone ?? '',
          roles: [body.role]
        },
        emailRedirectTo: `${getRequestURL(event).origin}/auth/callback`
      }
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { user: data.user };
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