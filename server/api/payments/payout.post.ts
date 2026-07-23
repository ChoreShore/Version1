import { serverSupabaseClient } from '#supabase/server';
import { PayoutSchema, PayoutResponseSchema } from '~/schemas/payment';
import { getAuthenticatedUser, ensureJobOwner } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Authentication required');

    const body = await readBody(event);
    const validation = PayoutSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.error.flatten().fieldErrors }
      });
    }

    const { contract_id, idempotency_key } = validation.data;
    const client = await serverSupabaseClient(event);

    const { data: contract, error: contractError } = await client
      .from('contracts')
      .select('id, employer_id, worker_id, job_id, payout_amount, payout_status, status')
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
    }

    if (contract.status !== 'completed') {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot process payout for contract with status "${contract.status}". Only completed contracts can be paid out.`
      });
    }

    // Authorization check: only the job employer can process payouts
    await ensureJobOwner(client, contract.job_id, user.id);

    const occurredAt = new Date().toISOString();
    const payoutAmount = Number(contract.payout_amount ?? 0);

    if (idempotency_key) {
      const { data: existingProcessed } = await client
        .from('payment_transactions')
        .select('status, amount, occurred_at')
        .eq('event_type', 'worker_payout')
        .eq('contract_id', contract_id)
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();

      if (existingProcessed?.status === 'processed') {
        return PayoutResponseSchema.parse({
          success: true,
          payout_amount: Number(existingProcessed.amount ?? payoutAmount),
          status: 'processed',
          occurred_at: existingProcessed.occurred_at
        });
      }
    }

    const { data: pendingEvent } = await client
      .from('payment_transactions')
      .select('id')
      .eq('event_type', 'worker_payout')
      .eq('contract_id', contract_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingEvent?.id) {
      const { error: pendingUpdateError } = await client
        .from('payment_transactions')
        .update({
          status: 'processed',
          occurred_at: occurredAt,
          idempotency_key: idempotency_key ?? null
        })
        .eq('id', pendingEvent.id);

      if (pendingUpdateError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to update pending payout event' });
      }
    } else {
      const { error: payoutInsertError } = await client
        .from('payment_transactions')
        .insert({
          contract_id: contract_id,
          job_id: contract.job_id,
          employer_id: contract.employer_id,
          worker_id: contract.worker_id,
          actor_user_id: user.id,
          actor_role: 'employer',
          event_type: 'worker_payout',
          status: 'processed',
          amount: payoutAmount,
          currency: 'GBP',
          idempotency_key: idempotency_key ?? null,
          occurred_at: occurredAt,
          metadata: {
            source: 'job_completion'
          }
        });

      if (payoutInsertError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create payout event' });
      }
    }

    const { error: contractUpdateError } = await client
      .from('contracts')
      .update({
        payout_status: 'processed',
        updated_at: occurredAt
      })
      .eq('id', contract_id);

    if (contractUpdateError) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to update contract payout status' });
    }

    return PayoutResponseSchema.parse({
      success: true,
      payout_amount: payoutAmount,
      status: 'processed',
      occurred_at: occurredAt
    });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to process payout'
    });
  }
});
