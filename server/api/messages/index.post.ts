import { serverSupabaseClient } from '#supabase/server';
import { validateCreateMessage, MessageResponseSchema } from '~/schemas/message';
import { getAuthenticatedUser } from '~/server/utils/api';
import { ensureMessageParticipant } from '~/server/utils/api';
import { logger } from '~/server/utils/logger';
import { rateLimiters } from '~/server/utils/rateLimit';
import { getErrorMessage, logDetailedError } from '~/server/utils/errorMessages';
import { requireCsrfProtection } from '~/server/utils/csrf';
import { sendNotificationEmail, getUserDetails } from '~/server/utils/email';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const user = await getAuthenticatedUser(event, 'Sign in to send messages');

    // Apply rate limiting based on user ID
    await rateLimiters.messages(user.id);

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

    // Authorization check: ensure user is a participant in this job conversation
    await ensureMessageParticipant(client, validatedData.job_id, user.id);

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
      .select('id, title, employer_id')
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
        statusMessage: 'You are not authorized to send messages for this application'
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

    // Check for idempotency: if client_message_id is provided, check if message already exists
    if (validatedData.client_message_id) {
      const { data: existingMessage } = await client
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, id, first_name, last_name, bio),
          receiver:profiles!messages_receiver_id_fkey(username, id, first_name, last_name, bio)
        `)
        .eq('client_message_id', validatedData.client_message_id)
        .eq('sender_id', user.id)
        .maybeSingle();

      if (existingMessage) {
        const response = { message: existingMessage };
        try {
          return MessageResponseSchema.parse(response);
        } catch (validationError) {
          logger.error('Response validation failed', validationError, 'messages/index.post');
          throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
        }
      }
    }

    const { data, error } = await client
      .from('messages')
      .insert({
        job_id: validatedData.job_id,
        application_id: validatedData.application_id,
        sender_id: user.id,
        receiver_id: validatedData.receiver_id,
        body: validatedData.body,
        attachment_url: validatedData.attachment_url || null,
        client_message_id: validatedData.client_message_id || null
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(username, id, first_name, last_name, bio),
        receiver:profiles!messages_receiver_id_fkey(username, id, first_name, last_name, bio)
      `)
      .single();

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    // Notify receiver of new message (fire-and-forget)
    if (job?.title) {
      const sender = await getUserDetails(event, user.id);
      const senderName = [sender.firstName, sender.lastName].filter(Boolean).join(' ') || 'Someone';
      const messagePreview = (data.body as string)?.slice(0, 100) + ((data.body as string)?.length > 100 ? '…' : '');
      sendNotificationEmail(event, {
        userId: validatedData.receiver_id,
        subject: `New message from ${senderName} about "${job.title}"`,
        html: `<p>Hi there,</p><p><strong>${senderName}</strong> sent you a message about "<strong>${job.title}</strong>":</p><blockquote style="border-left: 3px solid #ddd; padding-left: 12px; margin: 12px 0; color: #555;">${messagePreview}</blockquote><p>Log in to your dashboard to reply.</p>`,
        idempotencyKey: `message-received/${data.id}`
      }).catch(() => {});
    }

    const response = { message: data };
    
    // Validate response with Zod schema (safe validation)
    try {
      return MessageResponseSchema.parse(response);
    } catch (validationError) {
      logger.error('Response validation failed', validationError, 'messages/index.post');
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});