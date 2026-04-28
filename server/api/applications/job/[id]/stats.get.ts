import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ApplicationStatsResponseSchema } from '~/schemas/application';
import { handleSupabaseAuthErrors } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const jobId = getRouterParam(event, 'id');
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({ 
        statusCode: 401, 
        statusMessage: 'Sign in to view application statistics' 
      });
    }

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!jobId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid job ID format' });
    }

    const client = await serverSupabaseClient(event);

    // Get application counts by status
    const { data: applications, error } = await client
      .from('applications')
      .select('status')
      .eq('job_id', jobId);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Calculate stats
    const stats = {
      total: applications?.length ?? 0,
      pending: applications?.filter(app => app.status === 'pending').length ?? 0,
      accepted: applications?.filter(app => app.status === 'accepted').length ?? 0,
      rejected: applications?.filter(app => app.status === 'rejected').length ?? 0
    };

    // Validate response with Zod schema (safe validation)
    try {
      return ApplicationStatsResponseSchema.parse(stats);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return stats;
    }
  } catch (error: any) {
    handleSupabaseAuthErrors(error);
    throw error;
  }
});
