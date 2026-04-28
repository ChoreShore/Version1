import { serverSupabaseUser } from '#supabase/server';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);
    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view your profile' 
      });
    }
    return { user };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
