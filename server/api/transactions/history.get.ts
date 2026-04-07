import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to view transaction history'
    );

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('transactions')
      .select(`
        *,
        contract:contracts(id, job_id, employer_id, worker_id, status, job:jobs(title))
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const transactions = (data ?? []).map((txn: any) => ({
      ...txn,
      job_title: txn.contract?.job?.title ?? null
    }));

    return { transactions };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
