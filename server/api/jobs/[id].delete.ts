import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { assertValidUuid, ensureAuthenticated, handleSupabaseAuthErrors, ensureJobOwner } from '~/server/utils/api';

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

    // Authorization check: ensure user owns this job
    await ensureJobOwner(client, jobId, user.id);

    // Check for existing contracts (financial records - prevent deletion)
    const { data: contracts } = await client
      .from('contracts')
      .select('id')
      .eq('job_id', jobId)
      .limit(1);

    if (contracts && contracts.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Cannot delete job with existing contracts. Contracts must be completed or cancelled first.'
      });
    }

    // Check for existing applications (prevent deletion unless all are withdrawn)
    const { data: applications } = await client
      .from('applications')
      .select('id, status')
      .eq('job_id', jobId);

    if (applications && applications.length > 0) {
      const activeApplications = applications.filter(app => app.status !== 'withdrawn');
      if (activeApplications.length > 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Cannot delete job with ${activeApplications.length} active application(s). Applications must be withdrawn or the job must be closed first.`
        });
      }
    }

    const { error } = await client
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Job not found' });
      }
      
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { success: true };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});