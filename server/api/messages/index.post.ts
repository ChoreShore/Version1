import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateCreateMessage, MessageResponseSchema } from '~/schemas/message';

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event);

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Sign in to send messages'
      });
    }

    const body = await readBody(event);

    // Validate request body with Zod
    const validation = validateCreateMessage(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

    const validatedData = validation.data;

    const client = await serverSupabaseClient(event);

    const { data: canSend, error: guardError } = await client.rpc('can_send_message', {
      p_job_id: validatedData.job_id,
      p_sender_id: user.id,
      p_receiver_id: validatedData.receiver_id
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
        job_id: validatedData.job_id,
        application_id: validatedData.application_id,
        sender_id: user.id,
        receiver_id: validatedData.receiver_id,
        body: validatedData.body,
        attachment_url: validatedData.attachment_url || null
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

    const response = { message: data };
    
    // Validate response with Zod schema (safe validation)
    try {
      return MessageResponseSchema.parse(response);
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