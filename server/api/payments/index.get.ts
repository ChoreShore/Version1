import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { PaymentsListResponseSchema } from '~/schemas/payment';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    logger.debug('Starting request', 'payments/index.get');
    const user = await getAuthenticatedUser(event, 'Sign in to view payments');
    logger.debug('User authenticated', 'payments/index.get', user.id);

    const query = getQuery(event);
    const role = query.role === 'worker' ? 'worker' : 'employer';

    const client = await serverSupabaseClient(event);

    let builder = client
      .from('payment_transactions')
      .select(`
        id,
        application_id,
        contract_id,
        job_id,
        employer_id,
        worker_id,
        actor_user_id,
        actor_role,
        event_type,
        status,
        amount,
        currency,
        payment_intent_id,
        occurred_at,
        metadata,
        job:jobs(title),
        employer:profiles!payment_transactions_employer_id_fkey(first_name, last_name),
        worker:profiles!payment_transactions_worker_id_fkey(username, first_name, last_name, bio)
      `)
      .order('occurred_at', { ascending: false });

    builder = role === 'worker'
      ? builder.eq('worker_id', user.id)
      : builder.eq('employer_id', user.id);

    const { data, error } = await builder;

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const events = (data ?? []).map((row: any) => {
      const counterparty = role === 'worker' ? row.employer : row.worker;
      return {
        id: row.id,
        event_type: row.event_type,
        status: row.status,
        amount: Number(row.amount ?? 0),
        currency: row.currency ?? 'GBP',
        occurred_at: row.occurred_at,
        job_id: row.job_id,
        job_title: row.job?.title ?? 'Unknown job',
        application_id: row.application_id,
        contract_id: row.contract_id,
        actor_role: row.actor_role,
        actor_user_id: row.actor_user_id,
        counterparty_name: counterparty ? `${counterparty.first_name ?? ''} ${counterparty.last_name ?? ''}`.trim() : null,
        payment_intent_id: row.payment_intent_id
      };
    });

    return PaymentsListResponseSchema.parse({ events });
  } catch (error: any) {
    logger.error('Request failed', error, 'payments/index.get');
    throw error;
  }
});
