import { DeleteAccountSchema } from '~/schemas/auth';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { getAuthenticatedUser } from '~/server/utils/api';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    
    const validation = DeleteAccountSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error.issues[0].message
      });
    }

    const user = await getAuthenticatedUser(event, 'Sign in to delete your account');
    const client = await serverSupabaseClient(event);

    if (!user.email) {
      throw createError({ statusCode: 400, statusMessage: 'User email is required' });
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email,
      password: validation.data.password
    });

    if (signInError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid password'
      });
    }

    const { error: deleteError } = await client.rpc('delete_user');

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete account'
      });
    }

    await client.auth.signOut();

    return { success: true, message: 'Account deleted successfully' };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete account'
    });
  }
});
