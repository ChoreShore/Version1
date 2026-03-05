import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { CreateMessagePayload, MessageResponse } from '~/types/message';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to send messages'
      });
    }

    const body = await readBody<CreateMessagePayload>(event);

    if (!body.job_id || !body.application_id || !body.receiver_id || !body.body?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'job_id, application_id, receiver_id and body are required'
      });
    }

    const client = await serverSupabaseClient(event);

    const { data: canSend, error: guardError } = await client.rpc('can_send_message', {
      p_job_id: body.job_id,
      p_sender_id: user.id,
      p_receiver_id: body.receiver_id
    });

    if (guardError) {
      throw createError({ statusCode: 400, statusMessage: guardError.message });
    }

    if (!canSend) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Messaging is only available for accepted applications within 30 days of completion'
      });
    }

    const { data, error } = await client
      .from('messages')
      .insert({
        job_id: body.job_id,
        application_id: body.application_id,
        sender_id: user.id,
        receiver_id: body.receiver_id,
        body: body.body.trim(),
        attachment_url: body.attachment_url || null
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, first_name, last_name),
        receiver:profiles!messages_receiver_id_fkey(id, first_name, last_name)
      `)
      .single();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { message: data } as MessageResponse;
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