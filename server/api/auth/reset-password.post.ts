import { PasswordResetSchema } from '~/schemas/auth';
import { validatePasswordReset } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';
import { rateLimiters } from '~/server/utils/rateLimit';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Apply rate limiting based on email
    rateLimiters.auth(body.email);

    // Validate request body with Zod
    const validation = validatePasswordReset(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
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
    throw error;
  }
});
