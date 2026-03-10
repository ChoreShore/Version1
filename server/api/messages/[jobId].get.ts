import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { MessagesResponseSchema } from '~/schemas/message';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to view messages'
      });
    }

    const jobId = getRouterParam(event, 'jobId');

    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Job ID is required' });
    }

    // Basic ID validation (UUID format will be validated by database)
    if (!jobId.trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid Job ID format' });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .eq('job_id', jobId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('sent_at', { ascending: true });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    const response = { messages: data || [] };
    
    // Validate response with Zod schema (safe validation)
    try {
      return MessagesResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
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