import { UpdatePasswordSchema } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    const user = await getAuthenticatedUser(event, 'Unauthorized - Please sign in');

    // Apply rate limiting based on authenticated user ID
    await rateLimiters.password(user.id);

    const validation = UpdatePasswordSchema.safeParse(body);

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error.issues[0].message
      });
    }

    const client = await serverSupabaseClient(event);

    if (!user.email) {
      throw createError({ statusCode: 400, statusMessage: 'User email is required' });
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email,
      password: validation.data.currentPassword
    });

    if (signInError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect'
      });
    }

    const { error: updateError } = await client.auth.updateUser({
      password: validation.data.newPassword
    });

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Failed to update password'
      });
    }

    return { success: true, message: 'Password updated successfully' };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update password'
    });
  }
});
