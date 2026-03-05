import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { assertValidUuid, ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to delete jobs'
    );
    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

    const client = await serverSupabaseClient(event);

    const { error } = await client
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Job not found' });
      }
      
      // Check if it's an RLS policy violation
      if (error.code === '42501') {
        throw createError({ statusCode: 403, statusMessage: 'You can only delete your own jobs' });
      }
      
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { success: true };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});