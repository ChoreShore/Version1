import { serverSupabaseClient } from '#supabase/server';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event);
    const { error } = await client.auth.signOut();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { success: true };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
