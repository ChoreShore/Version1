import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ensureAuthenticated, assertValidUuid, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to view contract details'
    );

    const contractId = assertValidUuid(getRouterParam(event, 'id'), { label: 'Contract ID' });
    const client = await serverSupabaseClient(event);

    const { data: contract, error } = await client
      .from('contracts')
      .select(`
        *,
        escrow_payment:escrow_payments(*),
        transactions:transactions(*),
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

    if (contract.employer_id !== user.id && contract.worker_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this contract'
      });
    }

    const { escrow_payment, transactions, job, employer, worker, ...contractData } = contract as any;

    return {
      contract: {
        ...contractData,
        escrow_payment: escrow_payment ?? null,
        transactions: transactions ?? [],
        job_title: job?.title,
        job_budget_amount: job?.budget_amount ?? null,
        employer_first_name: employer?.first_name,
        employer_last_name: employer?.last_name,
        worker_first_name: worker?.first_name,
        worker_last_name: worker?.last_name
      }
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
