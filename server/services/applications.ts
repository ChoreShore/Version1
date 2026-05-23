import { createError } from 'h3';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateApplicationInput } from '~/schemas/application';
import { ApplicationResponseSchema } from '~/schemas/application';
import { ensureApplicationOwner, ensureJobEmployer } from '~/server/utils/api';

import { logger } from '~/server/utils/logger';

export async function fetchApplication(client: SupabaseClient, applicationId: string) {
  const { data, error } = await client
    .from('applications')
    .select('id, status, job_id, worker_id, version')
    .eq('id', applicationId)
    .single();

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' });
  }
  return data;
}

export async function authorizeAction(
  client: SupabaseClient,
  applicationId: string,
  currentApp: { job_id: string; worker_id: string },
  userId: string,
  newStatus?: string
) {
  if (newStatus === 'accepted' || newStatus === 'rejected') {
    await ensureJobEmployer(client, currentApp.job_id, userId);
  } else if (newStatus === 'withdrawn') {
    await ensureApplicationOwner(client, applicationId, userId);
  }
}

export async function fetchJob(client: SupabaseClient, jobId: string) {
  const { data, error } = await client
    .from('jobs')
    .select('id, employer_id, status, deadline, budget_type, budget_amount')
    .eq('id', jobId)
    .single();

  if (error || !data) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' });
  }
  return data;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: ['pending'],
  withdrawn: ['pending']
};

export function validateStatusTransition(currentStatus: string, newStatus?: string) {
  if (!newStatus || newStatus === currentStatus) return;

  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot change application status from "${currentStatus}" to "${newStatus}"`
    });
  }
}

export function validateJobOpenForAccept(job: { status: string }, newStatus?: string) {
  if (newStatus === 'accepted' && job.status !== 'open') {
    throw createError({
      statusCode: 400,
      statusMessage: `Cannot accept application for a job with status "${job.status}"`
    });
  }
}

export async function fetchPaymentEvent(client: SupabaseClient, applicationId: string) {
  const { data } = await client
    .from('payment_transactions')
    .select('payment_intent_id, amount, metadata')
    .eq('application_id', applicationId)
    .eq('event_type', 'employer_payment')
    .eq('status', 'processed')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function requirePaymentForFixedPrice(
  job: { budget_type: string },
  paymentEvent: unknown,
  newStatus?: string
) {
  if (newStatus === 'accepted' && job.budget_type === 'fixed' && !paymentEvent) {
    throw createError({
      statusCode: 402,
      statusMessage: 'Payment required before accepting this fixed-price application'
    });
  }
}

export async function preventDoubleHire(
  client: SupabaseClient,
  jobId: string,
  newStatus?: string
) {
  if (newStatus !== 'accepted') return;

  const { data: existing } = await client
    .from('applications')
    .select('id')
    .eq('job_id', jobId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This job already has an accepted application'
    });
  }
}

export async function processAcceptance(
  client: SupabaseClient,
  applicationId: string,
  userId: string,
  job: { budget_type: string; budget_amount: number | null },
  paymentEvent: { payment_intent_id: string | null; amount: number | null; metadata: any } | null
) {
  const { error: acceptError } = await client
    .rpc('accept_application', {
      p_application_id: applicationId,
      p_employer_id: userId
    });

  if (acceptError) {
    throw createError({
      statusCode: 400,
      statusMessage: acceptError.message || 'Failed to accept application'
    });
  }

  const { data: acceptedContract } = await client
    .from('contracts')
    .select('id, payout_amount, employer_id, worker_id, job_id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (acceptedContract && job.budget_type === 'fixed' && paymentEvent) {
    const payoutAmount = Number(job.budget_amount ?? 0);
    const platformFee = Number((payoutAmount * 0.15).toFixed(2));
    const escrowAmount = Number((payoutAmount + platformFee).toFixed(2));

    await client
      .from('contracts')
      .update({
        payment_confirmed: true,
        escrow_amount: escrowAmount,
        platform_fee: platformFee,
        payout_amount: payoutAmount,
        payout_status: 'pending',
        payment_intent_id: paymentEvent.payment_intent_id,
        frozen_budget_amount: payoutAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', acceptedContract.id);

    const { data: existingWorkerPayout } = await client
      .from('payment_transactions')
      .select('id')
      .eq('contract_id', acceptedContract.id)
      .eq('event_type', 'worker_payout')
      .maybeSingle();

    if (!existingWorkerPayout) {
      await client
        .from('payment_transactions')
        .insert({
          application_id: applicationId,
          contract_id: acceptedContract.id,
          job_id: acceptedContract.job_id,
          employer_id: acceptedContract.employer_id,
          worker_id: acceptedContract.worker_id,
          actor_user_id: userId,
          actor_role: 'system',
          event_type: 'worker_payout',
          status: 'pending',
          amount: payoutAmount,
          currency: 'GBP',
          occurred_at: new Date().toISOString(),
          metadata: { source: 'accept_application' }
        });
    }
  }

  const { data: updatedApp, error: fetchError } = await client
    .from('applications')
    .select('id, job_id, worker_id, status, cover_letter, proposed_rate, withdrawal_reason, created_at, updated_at')
    .eq('id', applicationId)
    .single();

  if (fetchError || !updatedApp) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch updated application' });
  }

  return updatedApp;
}

export async function updateApplication(
  client: SupabaseClient,
  applicationId: string,
  currentApp: { version: number },
  validatedData: UpdateApplicationInput
) {
  const { data, error } = await client
    .from('applications')
    .update({
      status: validatedData.status,
      cover_letter: validatedData.cover_letter,
      proposed_rate: validatedData.proposed_rate,
      withdrawal_reason: validatedData.withdrawal_reason ?? null
    })
    .eq('id', applicationId)
    .eq('version', currentApp.version)
    .select('id, job_id, worker_id, status, cover_letter, proposed_rate, withdrawal_reason, created_at, updated_at, version')
    .single();

  if (error) {
    if (error.code === 'PGRST116' && error.message?.includes('not found')) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }
    if (error.code === '42501') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only update applications you have permission to manage'
      });
    }
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return data;
}

export async function logHistory(
  client: SupabaseClient,
  applicationId: string,
  fromStatus: string,
  toStatus: string,
  changedBy: string
) {
  await client.from('application_status_history').insert({
    application_id: applicationId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: changedBy
  });
}

export function buildResponse(application: unknown) {
  const response = { application };
  try {
    return ApplicationResponseSchema.parse(response);
  } catch (error) {
    logger.error('Response validation failed', error, 'applications.service');
    throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
  }
}
