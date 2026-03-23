import { DeleteAccountSchema } from '~/schemas/auth';
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
    
    const validation = DeleteAccountSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error.issues[0].message
      });
    }

    const client = await serverSupabaseClient(event);
    
    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email!,
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
