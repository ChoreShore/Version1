import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { ConversationsResponse } from '~/types/message';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to view conversations'
      });
    }

    const client = await serverSupabaseClient(event);

    const { data, error } = await client.rpc('get_message_conversations', {
      p_user_id: user.id
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { conversations: data || [] } as ConversationsResponse;
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