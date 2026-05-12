import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { MessagesResponseSchema } from '~/schemas/message';
import { rethrowIfAuthError, ensureAuthenticated, ensureMessageParticipant } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = ensureAuthenticated(
      await serverSupabaseUser(event),
      'Sign in to view messages'
    );

    const jobId = getRouterParam(event, 'id');

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!jobId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid Job ID format' });
    }

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
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .eq('job_id', jobId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('sent_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { messages: data || [], pagination: { offset, limit, hasMore: (data?.length || 0) === limit } };
    
    // Validate response with Zod schema (safe validation)
    try {
      return MessagesResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    rethrowIfAuthError(error);
    throw error;
  }
});