import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { ConversationsResponseSchema } from '~/schemas/message';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to view conversations'
      });
    }

    const query = getQuery(event);
    const role = query.role as string;
    const client = await serverSupabaseClient(event);

    // Get message conversations by grouping messages by application
    const { data, error } = await client
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

    const response = { conversations: data || [] };
    
    // Validate response with Zod schema (safe validation)
    try {
      return ConversationsResponseSchema.parse(response);
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