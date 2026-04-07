import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateRefundEscrow } from '~/schemas/payment';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';
import { mockStripe } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to request a refund'
    );

    const body = await readBody(event);
    const validation = validateRefundEscrow(body);

    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const { contract_id } = validation.data;
    const client = await serverSupabaseClient(event);

    const { data: contract, error: contractError } = await client
      .from('contracts')
      .select('*')
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
    }

    if (contract.employer_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Only the employer can request a refund' });
    }

    if (!['pending', 'active'].includes(contract.status)) {
      throw createError({
        statusCode: 409,
        statusMessage: `Cannot refund a contract in '${contract.status}' status`
      });
    }

    const { data: escrow, error: escrowError } = await client
      .from('escrow_payments')
      .select('*')
      .eq('contract_id', contract_id)
      .maybeSingle();

    if (escrowError) {
      throw createError({ statusCode: 400, statusMessage: escrowError.message });
    }

    if (escrow) {
      if (escrow.status !== 'held') {
        throw createError({
          statusCode: 409,
          statusMessage: `Escrow is already '${escrow.status}'`
        });
      }

      mockStripe.refundPaymentIntent(escrow.stripe_payment_intent_id ?? '');

      const { error: updateEscrowError } = await client
        .from('escrow_payments')
        .update({ status: 'refunded' })
        .eq('id', escrow.id);

      if (updateEscrowError) {
        throw createError({ statusCode: 400, statusMessage: updateEscrowError.message });
      }

      await client.from('transactions').insert({
        user_id: user.id,
        contract_id,
        amount: escrow.total_amount,
        transaction_type: 'refund',
        stripe_transaction_id: mockStripe.generateTransactionId()
      });
    }

    const { error: updateContractError } = await client
      .from('contracts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', contract_id);

    if (updateContractError) {
      throw createError({ statusCode: 400, statusMessage: updateContractError.message });
    }

    return {
      success: true,
      contract_id,
      refund_amount: escrow?.total_amount ?? 0,
      escrow_status: escrow ? 'refunded' : 'n/a',
      contract_status: 'cancelled'
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
