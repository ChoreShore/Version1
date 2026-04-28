import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateUpdateApplication, ApplicationResponseSchema } from '~/schemas/application';
import { rateLimiters } from '~/server/utils/rateLimit';
import { ensureAuthenticated, ensureApplicationOwner, ensureJobEmployer } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to update applications'
    );

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!applicationId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

    // Apply rate limiting based on user ID
    rateLimiters.applications(user.id);

    // Validate request body with Zod
    const validation = validateUpdateApplication(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;

    const client = await serverSupabaseClient(event);

    // Fetch current application status to validate transitions
    const { data: currentApp, error: fetchError } = await client
      .from('applications')
      .select('id, status, job_id, worker_id, version')
      .eq('id', applicationId)
      .single();

    if (fetchError || !currentApp) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    // Authorization checks based on the action being performed
    if (validatedData.status === 'accepted' || validatedData.status === 'rejected') {
      // Only the job employer can accept/reject applications
      await ensureJobEmployer(client, currentApp.job_id, user.id);
    } else if (validatedData.status === 'withdrawn') {
      // Only the applicant can withdraw their application
      await ensureApplicationOwner(client, applicationId, user.id);
    }

    // Fetch job to verify status
    const { data: job, error: jobError } = await client
      .from('jobs')
      .select('id, employer_id, status, deadline, budget_type, budget_amount')
      .eq('id', currentApp.job_id)
      .single();

    if (jobError || !job) {
      throw createError({ statusCode: 404, statusMessage: 'Job not found' });
    }

    // Define valid status transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ['accepted', 'rejected', 'withdrawn'],
      accepted: [], // For now, lock accepted applications from further changes
      rejected: [],
      withdrawn: []
    };

    // Validate the status transition
    if (validatedData.status && validatedData.status !== currentApp.status) {
      const allowedTransitions = VALID_TRANSITIONS[currentApp.status] || [];
      if (!allowedTransitions.includes(validatedData.status)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Cannot change application status from "${currentApp.status}" to "${validatedData.status}"`
        });
      }
    }

    // Job must be 'open' to accept applications
    if (validatedData.status === 'accepted' && job.status !== 'open') {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot accept application for a job with status "${job.status}"`
      });
    }

    let processedPaymentEvent: {
      payment_intent_id: string | null;
      amount: number | null;
      metadata: any;
    } | null = null;

    if (validatedData.status === 'accepted' && job.budget_type === 'fixed') {
      const { data: paymentEvent } = await client
        .from('payment_transactions')
        .select('payment_intent_id, amount, metadata')
        .eq('application_id', applicationId)
        .eq('event_type', 'employer_payment')
        .eq('status', 'processed')
        .order('occurred_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!paymentEvent) {
        throw createError({
          statusCode: 402,
          statusMessage: 'Payment required before accepting this fixed-price application'
        });
      }

      processedPaymentEvent = paymentEvent;
    }

    // Check if another application for this job is already accepted (prevent double-hire)
    if (validatedData.status === 'accepted') {
      const { data: existingAccepted } = await client
        .from('applications')
        .select('id')
        .eq('job_id', currentApp.job_id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (existingAccepted) {
        throw createError({
          statusCode: 409,
          statusMessage: 'This job already has an accepted application'
        });
      }
    }

    // When accepting an application, use the atomic RPC
    if (validatedData.status === 'accepted') {
      const { data: acceptResult, error: acceptError } = await client
        .rpc('accept_application', {
          p_application_id: applicationId,
          p_employer_id: user.id
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

      if (acceptedContract && job.budget_type === 'fixed' && processedPaymentEvent) {
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
            payment_intent_id: processedPaymentEvent.payment_intent_id,
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
              actor_user_id: user.id,
              actor_role: 'system',
              event_type: 'worker_payout',
              status: 'pending',
              amount: payoutAmount,
              currency: 'GBP',
              occurred_at: new Date().toISOString(),
              metadata: {
                source: 'accept_application'
              }
            });
        }
      }

      // Fetch the updated application to return
      const { data: updatedApp, error: fetchError } = await client
        .from('applications')
        .select('id, job_id, worker_id, status, cover_letter, proposed_rate, withdrawal_reason, created_at, updated_at')
        .eq('id', applicationId)
        .single();

      if (fetchError || !updatedApp) {
        throw createError({ statusCode: 500, statusMessage: 'Failed to fetch updated application' });
      }

      const response = { application: updatedApp };

      try {
        return ApplicationResponseSchema.parse(response);
      } catch (validationError) {
        return response;
      }
    }

    // For non-accept status changes (withdraw, reject), proceed with normal update
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
      // Check if no rows were affected (version mismatch)
      if (error.code === 'PGRST116') {
        throw createError({ statusCode: 409, statusMessage: 'This application was modified by another user. Please refresh and try again.' });
      }

      // Check if it's a "not found" error
      if (error.code === 'PGRST116' && error.message?.includes('not found')) {
        throw createError({ statusCode: 404, statusMessage: 'Application not found' });
      }

      // Check if it's an RLS policy violation
      if (error.code === '42501') {
        throw createError({
          statusCode: 403,
          statusMessage: 'You can only update applications you have permission to manage'
        });
      }

      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Log status change to history for non-accept operations
    if (validatedData.status && validatedData.status !== currentApp.status) {
      await client.from('application_status_history').insert({
        application_id: applicationId,
        from_status: currentApp.status,
        to_status: validatedData.status,
        changed_by: user.id
      });
    }

    const response = { application: data };

    try {
      return ApplicationResponseSchema.parse(response);
    } catch (validationError) {
      return response;
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
