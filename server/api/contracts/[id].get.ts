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
        worker:profiles!contracts_worker_id_fkey(username, first_name, last_name, bio)
      `)
      .eq('id', contractId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
      }
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = {
      contract: {
        ...contract,
        job_title: contract.job?.title,
        job_budget_amount: contract.job?.budget_amount,
        employer_first_name: contract.employer?.first_name,
        employer_last_name: contract.employer?.last_name,
        worker_first_name: contract.worker?.first_name,
        worker_last_name: contract.worker?.last_name,
        worker_username: contract.worker?.username || null,
        worker_bio: contract.worker?.bio || null
      }
    };

    return response;
  } catch (error: any) {
    throw error;
  }
});
