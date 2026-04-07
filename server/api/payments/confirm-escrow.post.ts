import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateConfirmEscrow } from '~/schemas/payment';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';
import { mockStripe } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to confirm payment'
    );

    const body = await readBody(event);
    const validation = validateConfirmEscrow(body);

    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const { contract_id, payment_intent_id } = validation.data;
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
      throw createError({ statusCode: 403, statusMessage: 'Only the employer can confirm payment' });
    }

    if (contract.status !== 'pending') {
      throw createError({
        statusCode: 409,
        statusMessage: `Contract is already in '${contract.status}' status`
      });
    }

    const { data: escrow, error: escrowError } = await client
      .from('escrow_payments')
      .select('*')
      .eq('contract_id', contract_id)
      .eq('stripe_payment_intent_id', payment_intent_id)
      .single();

    if (escrowError || !escrow) {
      throw createError({ statusCode: 404, statusMessage: 'Escrow payment not found' });
    }

    mockStripe.confirmPaymentIntent(payment_intent_id);

    const txnId = mockStripe.generateTransactionId();

    const { error: updateContractError } = await client
      .from('contracts')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', contract_id);

    if (updateContractError) {
      throw createError({ statusCode: 400, statusMessage: updateContractError.message });
    }

    await client.from('transactions').insert([
      {
        user_id: user.id,
        contract_id,
        amount: escrow.total_amount,
        transaction_type: 'deposit',
        stripe_transaction_id: txnId
      },
      {
        user_id: user.id,
        contract_id,
        amount: escrow.platform_fee,
        transaction_type: 'fee',
        stripe_transaction_id: mockStripe.generateTransactionId()
      }
    ]);

    return {
      success: true,
      contract_id,
      escrow_status: 'held',
      contract_status: 'active'
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
