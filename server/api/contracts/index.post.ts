import { validateCreateContract, ContractResponseSchema } from '~/schemas/contract';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { ensureJobEmployer } from '~/server/utils/api';
import { logger } from '~/server/utils/logger';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const body = await readBody(event);

    const user = await getAuthenticatedUser(event, 'Sign in to create contracts');

    const validation = validateCreateContract(body);

    if (!validation.success || !validation.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const { application_id, employer_id, worker_id, job_id } = validation.data;
    const client = await serverSupabaseClient(event);

    // Authorization check: only the job employer can create a contract
    await ensureJobEmployer(client, job_id, user.id);

    // Verify the application exists and belongs to this job
    const { data: application, error: applicationError } = await client
      .from('applications')
      .select('id, job_id, worker_id, status')
      .eq('id', application_id)
      .single();

    if (applicationError || !application) {
      throw createError({ statusCode: 404, statusMessage: 'Application not found' });
    }

    // Verify the application belongs to the specified job
    if (application.job_id !== job_id) {
      throw createError({ statusCode: 400, statusMessage: 'Application does not belong to this job' });
    }

    // Verify the application is in a valid state for contract creation
    if (application.status !== 'accepted') {
      throw createError({ statusCode: 400, statusMessage: 'Contract can only be created for accepted applications' });
    }

    const { data, error } = await client
      .from('contracts')
      .insert({ application_id, employer_id, worker_id, job_id, status: 'pending' })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation for duplicate contracts
      if (error.code === '23505' || error.message?.includes('unique_contract_application')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'A contract already exists for this application'
        });
      }
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    try {
      return ContractResponseSchema.parse({ contract: data });
    } catch {
      return { contract: data };
    }
  } catch (error: any) {
    throw error;
  }
});
