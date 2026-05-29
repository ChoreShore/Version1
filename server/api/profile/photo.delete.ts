import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { logger, logDetailedError } from '~/server/utils/logger';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const user = await getAuthenticatedUser(event, 'Sign in to delete your photo');

    const client = await serverSupabaseClient(event);

    // Get current photo_url from profiles table
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('photo_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      });
    }

    if (!profile.photo_url) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No photo to delete'
      });
    }

    // Extract file path from the public URL
    // The URL format is: https://xxx.supabase.co/storage/v1/object/public/profile-photos/folder/filename
    const url = new URL(profile.photo_url);
    const pathParts = url.pathname.split('/profile-photos/');
    if (pathParts.length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid photo URL format'
      });
    }
    const filePath = pathParts[1];

    // Delete from Supabase storage
    const { error: deleteError } = await client
      .storage
      .from('profile-photos')
      .remove([filePath]);

    if (deleteError) {
      logDetailedError(deleteError, 'photo-delete');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete photo from storage'
      });
    }

    // Update profiles table to remove photo_url
    const { error: updateError } = await client
      .from('profiles')
      .update({ photo_url: null })
      .eq('id', user.id);

    if (updateError) {
      logDetailedError(updateError, 'photo-url-clear');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile'
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'photo-delete-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'photo-delete-general');
    throw error;
  }
});
