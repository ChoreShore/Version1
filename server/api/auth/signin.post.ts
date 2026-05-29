import { validateSignIn } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';
import { logger, logDetailedError } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    // Apply rate limiting based on email
    await rateLimiters.auth(body.email);

    // Validate request body with Zod
    const validation = validateSignIn(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: getErrorMessage('VALIDATION_FAILED'),
        data: { errors: validation.errors }
      });
    }

    const client = await serverSupabaseClient(event);
    const { data, error } = await client.auth.signInWithPassword(validation.data);

    if (error) {
      logDetailedError(error, 'signin');
      throw createError({ statusCode: 400, statusMessage: getErrorMessage('AUTH_INVALID_CREDENTIALS') });
    }

    return { user: data.user };
  } catch (error: any) {
    // Handle Supabase client initialization errors
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'signin-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'signin-general');
    throw error;
  }
});
