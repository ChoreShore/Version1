import { validateWorkerOnboarding } from '~/schemas/worker';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { logger, logDetailedError } from '~/server/utils/logger';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const user = await getAuthenticatedUser(event, 'Sign in to complete your profile');

    const body = await readBody(event);

    // Validate request body with Zod
    const validation = validateWorkerOnboarding(body);
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: getErrorMessage('VALIDATION_FAILED'),
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;
    const client = await serverSupabaseClient(event);

    // If role is worker and user doesn't have it yet, add it
    if (validatedData.role === 'worker') {
      const { data: profile } = await client
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();

      const existingRoles = Array.isArray(profile?.roles) ? profile.roles : [];
      if (!existingRoles.includes('worker')) {
        const roles = [...existingRoles, 'worker'];
        const { error: roleError } = await client
          .from('profiles')
          .update({ roles })
          .eq('id', user.id);

        if (roleError) {
          logDetailedError(roleError, 'onboarding-add-role');
        }
      }
    }

    // Update profile with onboarding data
    const { error: updateError } = await client
      .from('profiles')
      .update({
        postcode: validatedData.postcode,
        worker_categories: validatedData.category_ids,
        worker_skills: validatedData.skills || [],
        bio: validatedData.bio,
        photo_url: validatedData.photo_url,
        onboarding_completed: true
      })
      .eq('id', user.id);

    if (updateError) {
      logDetailedError(updateError, 'onboarding-update');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save onboarding data'
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'onboarding-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'onboarding-general');
    throw error;
  }
});
