import { serverSupabaseClient } from '#supabase/server';
import { validatePhotoUpload, PhotoUploadSchema } from '~/schemas/profile';
import { getAuthenticatedUser } from '~/server/utils/api';
import { logger, logDetailedError } from '~/server/utils/logger';
import { getErrorMessage } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    const user = await getAuthenticatedUser(event, 'Sign in to upload photos');

    const formData = await readFormData(event);
    const file = formData.get('photo') as File;

    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Photo file is required'
      });
    }

    // Validate file using Zod schema
    const validation = validatePhotoUpload({ photo: file });
    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.errors?.photo || 'Invalid photo file'
      });
    }

    const client = await serverSupabaseClient(event);

    // Get user's role from profiles table
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

    // Determine folder based on role (use first role if multiple)
    const role = profile.roles && profile.roles.length > 0 ? profile.roles[0] : 'worker';
    const folder = role === 'employer' ? 'employer-photos' : 'worker-photos';

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await client
      .storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      logDetailedError(uploadError, 'photo-upload');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upload photo'
      });
    }

    // Get public URL
    const { data: { publicUrl } } = client
      .storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    // Update profiles table with photo_url
    const { error: updateError } = await client
      .from('profiles')
      .update({ photo_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      logDetailedError(updateError, 'photo-url-update');
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update profile with photo URL'
      });
    }

    return { 
      success: true, 
      photoUrl: publicUrl,
      path: filePath
    };
  } catch (error: any) {
    if (error.message?.includes('Auth session missing') || error.message?.includes('auth session missing')) {
      logDetailedError(error, 'photo-upload-auth');
      throw createError({
        statusCode: 401,
        statusMessage: getErrorMessage('AUTH_SESSION_MISSING')
      });
    }
    logDetailedError(error, 'photo-upload-general');
    throw error;
  }
});
