import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { MessagesResponse } from '~/types/message';

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

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
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

    return { messages: data || [] } as MessagesResponse;
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