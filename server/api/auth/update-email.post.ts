import { UpdateEmailSchema } from '~/schemas/auth';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    // Apply rate limiting based on user ID
    await rateLimiters.emailChange(event.context?.user?.id || 'unknown');

    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please sign in'
      });
    }

    const validation = UpdateEmailSchema.safeParse(body);

    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error.issues[0].message
      });
    }

    const client = await serverSupabaseClient(event);

    // Verify current password by re-authenticating
    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email!,
      password: validation.data.currentPassword
    });

    if (signInError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Current password is incorrect'
      });
    }

    // Prevent changing to the same email
    if (validation.data.newEmail.toLowerCase() === user.email!.toLowerCase()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New email must be different from your current email'
      });
    }

    // Update email — Supabase sends a confirmation email to the new address
    const { error: updateError } = await client.auth.updateUser({
      email: validation.data.newEmail
    });

    if (updateError) {
      logDetailedError(updateError, 'update-email');
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Failed to update email'
      });
    }

    return {
      success: true,
      message: 'Check your new email inbox to confirm the change'
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update email'
    });
  }
});
