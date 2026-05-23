import { serverSupabaseClient } from '#supabase/server';
import { MessagesResponseSchema } from '~/schemas/message';
import { logger } from '~/server/utils/logger';
import { getAuthenticatedUser, ensureMessageParticipant, assertValidUuid } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view messages');

    const jobId = assertValidUuid(getRouterParam(event, 'id'), {
      label: 'Job ID'
    });

    const client = await serverSupabaseClient(event);

    // Authorization check: ensure user is a participant in this job
    await ensureMessageParticipant(client, jobId, user.id);

    // Get pagination parameters
    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 50, 100); // Default 50, max 100
    const offset = Number(query.offset) || 0;

    const { data, error } = await client
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, id, first_name, last_name, bio),
        receiver:profiles!messages_receiver_id_fkey(username, id, first_name, last_name, bio)
      `)
      .eq('job_id', jobId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { messages: data || [], pagination: { offset, limit, hasMore: (data?.length || 0) === limit } };
    
    // Validate response with Zod schema
    try {
      return MessagesResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'messages/[jobId].get');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});