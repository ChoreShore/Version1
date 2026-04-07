import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateReleaseFunds } from '~/schemas/payment';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';
import { mockStripe } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to release funds'
    );

    const body = await readBody(event);
    const validation = validateReleaseFunds(body);

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
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the employer can release funds'
      });
    }

    if (contract.status !== 'active') {
      throw createError({
        statusCode: 409,
        statusMessage: `Contract must be 'active' to release funds (currently '${contract.status}')`
      });
    }

    const { data: escrow, error: escrowError } = await client
      .from('escrow_payments')
      .select('*')
      .eq('contract_id', contract_id)
      .single();

    if (escrowError || !escrow) {
      throw createError({ statusCode: 404, statusMessage: 'Escrow payment not found' });
    }

    if (escrow.status !== 'held') {
      throw createError({
        statusCode: 409,
        statusMessage: `Escrow is already '${escrow.status}'`
      });
    }

    const { error: updateEscrowError } = await client
      .from('escrow_payments')
      .update({ status: 'released' })
      .eq('id', escrow.id);

    if (updateEscrowError) {
      throw createError({ statusCode: 400, statusMessage: updateEscrowError.message });
    }

    const { error: updateContractError } = await client
      .from('contracts')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', contract_id);

    if (updateContractError) {
      throw createError({ statusCode: 400, statusMessage: updateContractError.message });
    }

    await client.from('transactions').insert({
      user_id: contract.worker_id,
      contract_id,
      amount: escrow.worker_payout_amount,
      transaction_type: 'release',
      stripe_transaction_id: mockStripe.generateTransactionId()
    });

    return {
      success: true,
      contract_id,
      payout_amount: escrow.worker_payout_amount,
      escrow_status: 'released',
      contract_status: 'completed'
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
