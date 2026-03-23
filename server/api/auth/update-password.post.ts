import { UpdatePasswordSchema } from '~/schemas/auth';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized - Please sign in'
      });
    }

    const body = await readBody(event);
    
    const validation = UpdatePasswordSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error.issues[0].message
      });
    }

    const client = await serverSupabaseClient(event);
    
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
