import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to fix contract worker IDs'
    );

    const client = await serverSupabaseClient(event);

    // Find contracts with NULL or empty worker_id
    const { data: contractsWithMissingWorkerId, error: fetchError } = await client
      .from('contracts')
      .select('id, application_id, worker_id')
      .is('worker_id', null);

    if (fetchError) {
      throw createError({ statusCode: 400, statusMessage: fetchError.message });
    }

    if (!contractsWithMissingWorkerId || contractsWithMissingWorkerId.length === 0) {
      return {
        success: true,
        message: 'No contracts with missing worker_id found',
        fixed: 0
      };
    }

    let fixedCount = 0;
    const errors: string[] = [];

    // Fix each contract by getting worker_id from the application
    for (const contract of contractsWithMissingWorkerId) {
      try {
        const { data: application } = await client
          .from('applications')
          .select('worker_id')
          .eq('id', contract.application_id)
          .single();

        if (application && application.worker_id) {
          const { error: updateError } = await client
            .from('contracts')
            .update({ worker_id: application.worker_id })
            .eq('id', contract.id);

          if (updateError) {
            errors.push(`Contract ${contract.id}: ${updateError.message}`);
          } else {
            fixedCount++;
          }
        } else {
          errors.push(`Contract ${contract.id}: Application ${contract.application_id} has no worker_id`);
        }
      } catch (err: any) {
        errors.push(`Contract ${contract.id}: ${err.message}`);
      }
    }

    return {
      success: true,
      message: `Fixed ${fixedCount} contracts`,
      fixed: fixedCount,
      total: contractsWithMissingWorkerId.length,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
