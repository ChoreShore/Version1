import { validateSignUp } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError, ErrorMessages } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    // Apply rate limiting based on email
    await rateLimiters.auth(body.email);

    // Validate request body with Zod
    const validation = validateSignUp(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: getErrorMessage('VALIDATION_FAILED'),
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;

    const client = await serverSupabaseClient(event);

    // Check if username already exists
    const { data: existingUser, error: checkError } = await client
      .from('profiles')
      .select('username')
      .eq('username', validatedData.username)
      .maybeSingle();

    if (checkError) {
      logDetailedError(checkError, 'signup-username-check');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to check username availability'
      });
    }

    if (existingUser) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username is already taken'
      });
    }

    const { data, error } = await client.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          username: validatedData.username,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          postcode: validatedData.postcode,
          roles: [validatedData.role]
        },
        emailRedirectTo: `${getRequestURL(event).origin}/auth/callback`
      }
    });

    if (error) {
      logDetailedError(error, 'signup');
      throw createError({ statusCode: 400, statusMessage: getErrorMessage('AUTH_EMAIL_EXISTS') });
    }

    return { user: data.user };
  } catch (error: any) {
    // Handle Supabase client initialization errors
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'signup-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'signup-general');
    throw error;
  }
});