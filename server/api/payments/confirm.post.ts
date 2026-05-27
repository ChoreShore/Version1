import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ConfirmPaymentSchema, PaymentConfirmationResponseSchema } from '~/schemas/payment';
import { ensureAuthenticated, ensureJobEmployer } from '~/server/utils/api';
import { sendNotificationEmail } from '~/server/utils/email';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Authentication required'
    );

    const body = await readBody(event);

    const validation = ConfirmPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.error.flatten().fieldErrors }
      });
    }

    const { application_id, payment_intent_id } = validation.data;
    const client = await serverSupabaseClient(event);
    const occurredAt = new Date().toISOString();

    // Fetch application to get job_id for authorization
    const { data: application, error: appError } = await client
      .from('applications')
      .select('id, job_id')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    // Authorization check: only the job employer can confirm payments
    await ensureJobEmployer(client, application.job_id, user.id);

    const { data: existingEvent } = await client
      .from('payment_transactions')
      .select('id, status')
      .eq('application_id', application_id)
      .eq('payment_intent_id', payment_intent_id)
      .eq('event_type', 'employer_payment')
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      return PaymentConfirmationResponseSchema.parse({
        success: true,
        status: 'processed',
        payment_intent_id,
        occurred_at: occurredAt
      });
    }

    if (existingEvent?.id) {
      const { error: updateError } = await client
        .from('payment_transactions')
        .update({
          status: 'processed',
          occurred_at: occurredAt
        })
        .eq('id', existingEvent.id);

      if (updateError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to confirm payment event' });
      }
    } else {
      const { data: application, error: appError } = await client
        .from('applications')
        .select('id, worker_id, job:jobs(id, employer_id, title)')
        .eq('id', application_id)
        .single();

      if (appError || !application) {
        throw createError({ statusCode: 404, statusMessage: 'Application not found' });
      }

      const { error: insertError } = await client
        .from('payment_transactions')
        .insert({
          application_id,
          job_id: application.job?.id,
          employer_id: application.job?.employer_id,
          worker_id: application.worker_id,
          actor_user_id: user.id,
          actor_role: 'employer',
          event_type: 'employer_payment',
          status: 'processed',
          amount: 0,
          currency: 'GBP',
          payment_intent_id,
          occurred_at: occurredAt,
          metadata: {
            backfilled: true,
            job_title: application.job?.title
          }
        });

      if (insertError) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to create confirmed payment event' });
      }
    }

    // Notify worker that payment has been confirmed (fire-and-forget)
    const { data: appWithJob } = await client
      .from('applications')
      .select('id, worker_id, job:jobs(id, title)')
      .eq('id', application_id)
      .single();

    if (appWithJob?.worker_id && (appWithJob.job as any)?.title) {
      sendNotificationEmail(event, {
        userId: appWithJob.worker_id,
        subject: `Payment confirmed for "${(appWithJob.job as any).title}"`,
        html: `<p>Hi there,</p><p>Good news — the employer has confirmed payment for "<strong>${(appWithJob.job as any).title}</strong>". The funds are now held in escrow and will be released when the job is completed.</p><p>Log in to your dashboard to get started.</p>`,
        idempotencyKey: `payment-confirmed/${application_id}/${payment_intent_id}`
      }).catch(() => {});
    }

    return PaymentConfirmationResponseSchema.parse({
      success: true,
      status: 'processed',
      payment_intent_id,
      occurred_at: occurredAt
    });
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to confirm payment'
    });
  }
});
