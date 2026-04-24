import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateUpdateApplication, ApplicationResponseSchema } from '~/schemas/application';
import { calculateEscrowFees } from '~/server/utils/fees';

export default defineEventHandler(async (event) => {
  try {
    const applicationId = getRouterParam(event, 'id');
    const body = await readBody(event);
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to update applications' 
      });
    }

    if (!applicationId) {
      throw createError({ statusCode: 400, statusMessage: 'Application ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!applicationId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid application ID format' });
    }

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

    // RLS will handle authorization:
    // - Employers can accept/reject (status: accepted/rejected)
    // - Workers can withdraw (status: withdrawn)

    const { data, error } = await client
      .from('applications')
      .update({
        status: validatedData.status,
        cover_letter: validatedData.cover_letter,
        proposed_rate: validatedData.proposed_rate,
        withdrawal_reason: validatedData.withdrawal_reason ?? null
      })
      .eq('id', applicationId)
      .select('id, job_id, worker_id, status, cover_letter, proposed_rate, withdrawal_reason, created_at, updated_at')
      .single();

    if (error) {
      // Check if it's a "not found" error
      if (error.code === 'PGRST116') {
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

    // When an application is accepted, auto-create a contract record
    if (validatedData.status === 'accepted' && data) {
      if (!data.worker_id) {
        console.error('Cannot create contract: worker_id is missing from application', applicationId);
      } else {
        const { data: job } = await client
          .from('jobs')
          .select('employer_id, budget_amount')
          .eq('id', data.job_id)
          .single();

        if (job) {
          const fees = calculateEscrowFees(job.budget_amount ?? 0);

          const { data: existingContract } = await client
            .from('contracts')
            .select('id')
            .eq('application_id', applicationId)
            .maybeSingle();

          if (!existingContract) {
            await client.from('contracts').insert({
              application_id: applicationId,
              employer_id: job.employer_id,
              worker_id: data.worker_id,
              job_id: data.job_id,
              status: 'pending'
            });
          }
        }
      }
    }

    const response = { application: data };
    
    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    // Handle Supabase client initialization errors
    if (error.message?.includes('Auth session missing') || 
        error.message?.includes('Supabase') ||
        error.message?.includes('session') ||
        error.message?.includes('authentication') ||
        error.statusCode === 500 ||
        error.statusCode === 401) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Auth session missing!' 
      });
    }
    throw error;
  }
});
