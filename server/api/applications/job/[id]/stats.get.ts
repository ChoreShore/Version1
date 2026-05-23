import { serverSupabaseClient } from '#supabase/server';
import { logger } from '~/server/utils/logger';
import { ApplicationStatsResponseSchema } from '~/schemas/application';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const jobId = getRouterParam(event, 'id');
    const user = await getAuthenticatedUser(event, 'Sign in to view application statistics');

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

    // Validate response with Zod schema
    try {
      return ApplicationStatsResponseSchema.parse(stats);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'applications/job/[id]/stats.get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});
