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

    // Verify the application exists and involves both sender and receiver
    const { data: application, error: appError } = await client
      .from('applications')
      .select('id, job_id, worker_id, status')
      .eq('id', validatedData.application_id)
      .eq('job_id', validatedData.job_id)
      .single();

    if (appError || !application) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Application not found'
      });
    }

    // Get the job to verify employer
    const { data: job, error: jobError } = await client
      .from('jobs')
      .select('employer_id')
      .eq('id', validatedData.job_id)
      .single();

    if (jobError || !job) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Job not found'
      });
    }

    // Verify sender and receiver are the worker and employer
    const isWorker = application.worker_id === user.id;
    const isEmployer = job.employer_id === user.id;
    const receiverIsWorker = application.worker_id === validatedData.receiver_id;
    const receiverIsEmployer = job.employer_id === validatedData.receiver_id;

    if (!isWorker && !isEmployer) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You are not part of this application conversation'
      });
    }

    if (!receiverIsWorker && !receiverIsEmployer) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid receiver for this application'
      });
    }

    // Verify sender and receiver are different people
    if (user.id === validatedData.receiver_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot send message to yourself'
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