import { serverSupabaseClient } from '#supabase/server';
import { assertValidUuid, getAuthenticatedUser } from '~/server/utils/api';
import { CompletionResponseSchema } from '~/schemas/contract';
import { sendNotificationEmail } from '~/server/utils/email';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Authentication required');
    const contractId = assertValidUuid(getRouterParam(event, 'id'), { label: 'Contract ID' });
    const client = await serverSupabaseClient(event);

    const { data: contract, error: contractError } = await client
      .from('contracts')
      .select('id, employer_id, worker_id, job_id, status')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
    }

    if (contract.worker_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Only the worker can mark this job as complete' });
    }

    if (contract.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot mark a contract with status "${contract.status}" as complete. Only active contracts can be marked complete.`
      });
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await client
      .from('contracts')
      .update({
        status: 'pending_review',
        worker_completed_at: now,
        updated_at: now
      })
      .eq('id', contractId)
      .select(`
        *,
        job:jobs(title, budget_amount),
        employer:profiles!contracts_employer_id_fkey(first_name, last_name),
        worker:profiles!contracts_worker_id_fkey(username, first_name, last_name, bio)
      `)
      .single();

    if (updateError || !updated) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to mark contract as complete' });
    }

    const jobTitle = (updated.job as any)?.title;
    if (jobTitle) {
      sendNotificationEmail(event, {
        userId: contract.employer_id,
        subject: `Worker marked "${jobTitle}" as complete`,
        html: `<p>Hi there,</p><p>The worker has marked "<strong>${jobTitle}</strong>" as complete. Please review the work and approve it to release the payment.</p><p>Log in to your dashboard to review and approve.</p>`,
        idempotencyKey: `contract-complete/${contractId}`
      }).catch(() => {});
    }

    const response = {
      success: true as const,
      contract: {
        ...updated,
        job_title: (updated.job as any)?.title,
        job_budget_amount: (updated.job as any)?.budget_amount,
        employer_first_name: (updated.employer as any)?.first_name,
        employer_last_name: (updated.employer as any)?.last_name,
        worker_first_name: (updated.worker as any)?.first_name,
        worker_last_name: (updated.worker as any)?.last_name,
        worker_username: (updated.worker as any)?.username || null,
        worker_bio: (updated.worker as any)?.bio || null
      }
    };

    try {
      return CompletionResponseSchema.parse(response);
    } catch {
      return response;
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to mark contract as complete'
    });
  }
});
