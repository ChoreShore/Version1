import { serverSupabaseClient } from '#supabase/server';
import { assertValidUuid, getAuthenticatedUser, ensureContractParticipant } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view contract details');

    const contractId = assertValidUuid(getRouterParam(event, 'id'), { label: 'Contract ID' });
    const client = await serverSupabaseClient(event);

    // Authorization check: ensure user is a participant in this contract
    await ensureContractParticipant(client, contractId, user.id);

    const { data: contract, error } = await client
      .from('contracts')
      .select(`
        *,
        job:jobs(title, budget_amount),
        employer:profiles!contracts_employer_id_fkey(first_name, last_name),
        worker:profiles!contracts_worker_id_fkey(first_name, last_name)
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
      }
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const { job, employer, worker, ...contractData } = contract as any;

    return {
      contract: {
        ...contractData,
        job_title: job?.title,
        job_budget_amount: job?.budget_amount ?? null,
        employer_first_name: employer?.first_name,
        employer_last_name: employer?.last_name,
        worker_first_name: worker?.first_name,
        worker_last_name: worker?.last_name
      }
    };
  } catch (error: any) {
    throw error;
  }
});
