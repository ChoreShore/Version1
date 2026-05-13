import { serverSupabaseClient } from '#supabase/server';
import { validateCreateContract, ContractResponseSchema } from '~/schemas/contract';
import { getAuthenticatedUser, ensureJobEmployer } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to create a contract');

    const body = await readBody(event);
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

    const { data: existingContract } = await client
      .from('contracts')
      .select('id')
      .eq('application_id', application_id)
      .maybeSingle();

    if (existingContract) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A contract already exists for this application'
      });
    }

    const { data, error } = await client
      .from('contracts')
      .insert({ application_id, employer_id, worker_id, job_id, status: 'pending' })
      .select()
      .single();

    if (error) {
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
