import { validateBio, BioSchema, sanitizeBio } from '~/schemas/profile';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { logger, logDetailedError } from '~/server/utils/logger';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    const user = await getAuthenticatedUser(event, 'Sign in to update your bio');

    // Validate bio using Zod schema
    const validation = validateBio(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.errors?.bio || 'Invalid bio'
      });
    }

    const client = await serverSupabaseClient(event);

    // Check if user has worker role
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Profile not found'
      });
    }

    const roles = (profile as any).roles || [];
    if (!roles.includes('worker')) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only workers can add a bio'
      });
    }

    // Sanitize bio
    const sanitizedBioText = body.bio ? sanitizeBio(body.bio) : null;

    // Update profiles table with bio
    const { error: updateError } = await client
      .from('profiles')
      .update({ bio: sanitizedBioText })
      .eq('id', user.id);

    if (updateError) {
      logDetailedError(updateError, 'bio-update');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update bio'
      });
    }

    return { success: true, bio: sanitizedBioText };
  } catch (error: any) {
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'bio-update-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'bio-update-general');
    throw error;
  }
});
