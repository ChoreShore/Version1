import { validateSignUp } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Validate request body with Zod
    const validation = validateSignUp(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;

    const client = await serverSupabaseClient(event);

    const { data, error } = await client.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone ?? '',
          roles: [validatedData.role]
        },
        emailRedirectTo: `${getRequestURL(event).origin}/auth/callback`
      }
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Create profile record with automatic role assignment
    if (data.user) {
      const { error: profileError } = await client
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: validatedData.email,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          phone: validatedData.phone ?? null,
          roles: [validatedData.role], // Auto-assign role based on sign-up choice
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (profileError) {
        // Log the error but don't fail the sign-up
        console.error('Profile creation error:', profileError);
        // The auth user is still created, so we continue
      }
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