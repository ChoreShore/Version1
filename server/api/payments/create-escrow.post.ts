import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateCreateEscrow } from '~/schemas/payment';
import { ensureAuthenticated, handleSupabaseAuthErrors } from '~/server/utils/api';
import { calculateEscrowFees } from '~/server/utils/fees';
import { mockStripe } from '~/server/utils/stripe';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to create an escrow payment'
    );

    const body = await readBody(event);
    const validation = validateCreateEscrow(body);

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
      .select('*, job:jobs(budget_amount)')
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
    }

    if (contract.employer_id !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only the employer can create an escrow payment'
      });
    }

    if (contract.status !== 'pending') {
      throw createError({
        statusCode: 409,
        statusMessage: `Contract is already in '${contract.status}' status`
      });
    }

    const { data: existingEscrow } = await client
      .from('escrow_payments')
      .select('id')
      .eq('contract_id', contract_id)
      .maybeSingle();

    if (existingEscrow) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An escrow payment already exists for this contract'
      });
    }

    const jobAmount = (contract as any).job?.budget_amount ?? 0;
    const fees = calculateEscrowFees(jobAmount);
    const paymentIntent = mockStripe.createPaymentIntent(
      fees.total_amount,
      fees.platform_fee_amount,
      fees.worker_payout_amount
    );

    const { data: escrow, error: escrowError } = await client
      .from('escrow_payments')
      .insert({
        contract_id,
        stripe_payment_intent_id: paymentIntent.id,
        total_amount: fees.total_amount,
        platform_fee: fees.platform_fee_amount,
        worker_payout_amount: fees.worker_payout_amount,
        status: 'held'
      })
      .select()
      .single();

    if (escrowError) {
      throw createError({ statusCode: 400, statusMessage: escrowError.message });
    }

    return {
      payment_intent: paymentIntent,
      escrow_id: escrow.id,
      fee_breakdown: fees
    };
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
