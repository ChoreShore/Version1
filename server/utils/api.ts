import { createError } from 'h3';
import type { SupabaseClient } from '@supabase/supabase-js';

const AUTH_ERROR_MARKERS = ['Auth session missing', 'Supabase', 'session', 'authentication'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface UuidValidationOptions {
  label?: string;
  requiredMessage?: string;
  invalidMessage?: string;
}

export function rethrowIfAuthError(error: any): void {
  if (
    error?.statusCode === 500 ||
    error?.statusCode === 401 ||
    (typeof error?.message === 'string' &&
      AUTH_ERROR_MARKERS.some((marker) => error.message.includes(marker)))
  ) {
    throw createError({ statusCode: 401, statusMessage: 'Auth session missing!' });
  }
}

/** @deprecated Use rethrowIfAuthError instead */
export function handleSupabaseAuthErrors(error: any): void {
  rethrowIfAuthError(error);
}

export function ensureAuthenticated<T>(user: T | null | undefined, message = 'Sign in to continue'): NonNullable<T> {
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: message });
  }
  return user as NonNullable<T>;
}

export function isValidUuid(value: string | null | undefined): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function assertValidUuid(
  value: string | null | undefined,
  options: UuidValidationOptions = {}
): string {
  const { label = 'ID', requiredMessage, invalidMessage } = options;

  if (!value) {
    throw createError({ statusCode: 400, statusMessage: requiredMessage ?? `${label} is required` });
  }

  if (!UUID_REGEX.test(value)) {
    throw createError({ statusCode: 400, statusMessage: invalidMessage ?? `Invalid ${label} format` });
  }

  return value;
}

// Authorization helper functions

export async function ensureJobOwner(
  client: SupabaseClient,
  jobId: string,
  userId: string
): Promise<void> {
  const { data: job, error } = await client
    .from('jobs')
    .select('employer_id')
    .eq('id', jobId)
    .single();

  if (error || !job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' });
  }

  if (job.employer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'You can only access your own jobs' });
  }
}

export async function ensureJobEmployer(
  client: SupabaseClient,
  jobId: string,
  userId: string
): Promise<void> {
  await ensureJobOwner(client, jobId, userId);
}

export async function ensureApplicationOwner(
  client: SupabaseClient,
  applicationId: string,
  userId: string
): Promise<void> {
  const { data: application, error } = await client
    .from('applications')
    .select('worker_id')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    throw createError({ statusCode: 404, statusMessage: 'Application not found' });
  }

  if (application.worker_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'You can only access your own applications' });
  }
}

export async function ensureContractParticipant(
  client: SupabaseClient,
  contractId: string,
  userId: string
): Promise<void> {
  const { data: contract, error } = await client
    .from('contracts')
    .select('employer_id, worker_id')
    .eq('id', contractId)
    .single();

  if (error || !contract) {
    throw createError({ statusCode: 404, statusMessage: 'Contract not found' });
  }

  if (contract.employer_id !== userId && contract.worker_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this contract' });
  }
}

export async function ensureMessageParticipant(
  client: SupabaseClient,
  jobId: string,
  userId: string
): Promise<void> {
  const { data: job, error: jobError } = await client
    .from('jobs')
    .select('id, employer_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    throw createError({ statusCode: 404, statusMessage: 'Job not found' });
  }

  // Check if user is the employer
  if (job.employer_id === userId) {
    return;
  }

  // If not employer, check if user is a worker with an application for this job
  const { data: application } = await client
    .from('applications')
    .select('id, worker_id, status')
    .eq('job_id', jobId)
    .eq('worker_id', userId)
    .maybeSingle();

  if (!application) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You are not authorized to view messages for this job'
    });
  }

  // Check if messaging is allowed for this application status
  if (!['pending', 'accepted'].includes(application.status)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Messaging disabled for this application status'
    });
  }
}

export async function ensurePaymentOwner(
  client: SupabaseClient,
  transactionId: string,
  userId: string
): Promise<void> {
  const { data: transaction, error } = await client
    .from('payment_transactions')
    .select('employer_id, worker_id')
    .eq('id', transactionId)
    .single();

  if (error || !transaction) {
    throw createError({ statusCode: 404, statusMessage: 'Payment transaction not found' });
  }

  if (transaction.employer_id !== userId && transaction.worker_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this payment' });
  }
}
