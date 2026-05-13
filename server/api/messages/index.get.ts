import { serverSupabaseClient } from '#supabase/server';
import { ConversationsResponseSchema } from '~/schemas/message';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    console.log('[messages/index.get] Starting request');
    const user = await getAuthenticatedUser(event, 'Sign in to view conversations');
    console.log('[messages/index.get] User authenticated:', user.id);
    const query = getQuery(event);
    const client = await serverSupabaseClient(event);

    // Get all messages for this user
    const { data: messages, error } = await client
      .from('messages')
      .select(`
        *,
        job:jobs!inner(title, employer_id),
        application:applications!inner(id, job_id, worker_id),
        sender:profiles!sender_id(first_name, last_name),
        receiver:profiles!receiver_id(first_name, last_name)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('sent_at', { ascending: false });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Group messages by application_id to create conversations
    const conversationsMap = new Map();
    
    (messages || []).forEach((message: any) => {
      const appId = message.application_id;
      
      if (!conversationsMap.has(appId)) {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        const otherUser = message.sender_id === user.id ? message.receiver : message.sender;
        
        conversationsMap.set(appId, {
          id: appId,
          job_id: message.job_id,
          job_title: message.job?.title,
          application_id: appId,
          other_user_id: otherUserId,
          other_participant_name: otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : 'User',
          last_message_preview: message.body,
          last_message_at: message.sent_at,
          unread_count: 0
        });
      }
    });

    // Calculate unread_count for each conversation
    // Note: This requires a 'read_at' column in the messages table for full implementation
    // For now, unread_count remains 0 until DB migration is applied
    const conversationsWithUnread = Array.from(conversationsMap.values()).map((conv: any) => {
      const unreadCount = (messages || []).filter((m: any) => 
        m.application_id === conv.application_id && 
        m.receiver_id === user.id && 
        !m.read_at
      ).length;
      return { ...conv, unread_count: unreadCount };
    });

    const response = { conversations: conversationsWithUnread };

    // Validate response with Zod schema (safe validation)
    try {
      return ConversationsResponseSchema.parse(response);
    } catch (validationError) {
      console.error('API Response validation failed:', validationError);
      // Return unvalidated response to prevent breaking the application
      return response;
    }
  } catch (error: any) {
    console.error('[messages/index.get] Error:', error);
    throw error;
  }
});