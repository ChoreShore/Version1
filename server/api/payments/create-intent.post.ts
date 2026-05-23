import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import {
  CreatePaymentIntentSchema,
  PaymentIntentResponseSchema
} from '~/schemas/payment';
import { ensureAuthenticated, ensureJobEmployer } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Authentication required'
    );

    const body = await readBody(event);
    const validation = CreatePaymentIntentSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.error.flatten().fieldErrors }
      });
    }

    const { application_id, idempotency_key } = validation.data;
    const client = await serverSupabaseClient(event);

    const { data: application, error: applicationError } = await client
      .from('applications')
      .select(`
        id,
        status,
        worker_id,
        job:jobs(id, employer_id, budget_type, budget_amount, title)
      `)
      .eq('id', application_id)
      .single();

    if (applicationError || !application) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    // Authorization check: only the job employer can create payment intents
    await ensureJobEmployer(client, application.job?.id, user.id);

    if (application.job?.budget_type !== 'fixed') {
      throw createError({ statusCode: 400, statusMessage: 'Payment intents are only required for fixed-price jobs' });
    }

    const { data: connectedMethod } = await client
      .from('payment_methods')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'employer')
      .eq('method_type', 'card')
      .eq('connection_status', 'connected')
      .eq('verification_status', 'verified')
      .maybeSingle();

    if (!connectedMethod) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Connect and verify a payment card in Settings before accepting this application.'
      });
    }

    // Check for existing payment intent with the same idempotency key
    const { data: existingIntent } = await client
      .from('payment_transactions')
      .select('payment_intent_id, amount, status, occurred_at, metadata')
      .eq('idempotency_key', idempotency_key)
      .eq('event_type', 'employer_payment')
      .maybeSingle();

    if (existingIntent?.payment_intent_id) {
      const existingPlatformFee = Number(existingIntent.metadata?.platform_fee ?? 0);
      const existingPayoutAmount = Number(existingIntent.metadata?.payout_amount ?? 0);
      return PaymentIntentResponseSchema.parse({
        success: true,
        payment_intent_id: existingIntent.payment_intent_id,
        client_secret: `${existingIntent.payment_intent_id}_secret_mock`,
        amount: Number(existingIntent.amount),
        platform_fee: existingPlatformFee,
        payout_amount: existingPayoutAmount,
        status: existingIntent.status,
        occurred_at: existingIntent.occurred_at,
        idempotency_key
      });
    }

    const baseAmount = Number(application.job?.budget_amount ?? 0);
    if (!baseAmount || baseAmount <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job budget for payment intent' });
    }

    const platformFee = Number((baseAmount * 0.15).toFixed(2));
    const escrowAmount = Number((baseAmount + platformFee).toFixed(2));
    const paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const occurredAt = new Date().toISOString();

    const { error: eventInsertError } = await client
      .from('payment_transactions')
      .insert({
        application_id,
        job_id: application.job?.id,
        employer_id: application.job?.employer_id,
        worker_id: application.worker_id,
        actor_user_id: user.id,
        actor_role: 'employer',
        event_type: 'employer_payment',
        status: 'pending',
        amount: escrowAmount,
        currency: 'GBP',
        payment_intent_id: paymentIntentId,
        idempotency_key: idempotency_key,
        occurred_at: occurredAt,
        metadata: {
          platform_fee: platformFee,
          payout_amount: baseAmount,
          job_title: application.job?.title
        }
      });

    if (eventInsertError) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create payment intent event' });
    }

    return PaymentIntentResponseSchema.parse({
      success: true,
      payment_intent_id: paymentIntentId,
      client_secret: `${paymentIntentId}_secret_mock`,
      amount: escrowAmount,
      platform_fee: platformFee,
      payout_amount: baseAmount,
      status: 'pending',
      occurred_at: occurredAt,
      idempotency_key
    });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create payment intent'
    });
  }
});
