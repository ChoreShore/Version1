import { serverSupabaseClient } from '#supabase/server';
import { validateCreateMessage, MessageResponseSchema } from '~/schemas/message';
import { getAuthenticatedUser, ensureMessageParticipant } from '~/server/utils/api';

// Simple in-memory rate limiter (for production, use Redis-backed rate limiting)
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute in ms
const RATE_LIMIT_MAX = 30; // 30 messages per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  
  // Filter out requests outside the time window
  const recentRequests = userRequests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }
  
  // Add current request timestamp
  recentRequests.push(now);
  rateLimitStore.set(userId, recentRequests);
  
  // Clean up old entries periodically
  if (rateLimitStore.size > 1000) {
    const cutoff = now - RATE_LIMIT_WINDOW;
    for (const [uid, timestamps] of rateLimitStore.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      if (filtered.length === 0) {
        rateLimitStore.delete(uid);
      } else {
        rateLimitStore.set(uid, filtered);
      }
    }
  }
  
  return true;
}

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to send messages');

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many messages. Please wait a moment before sending another.'
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
          sender:profiles!messages_sender_id_fkey(id, first_name, last_name),
          receiver:profiles!messages_receiver_id_fkey(id, first_name, last_name)
        `)
        .eq('client_message_id', validatedData.client_message_id)
        .eq('sender_id', user.id)
        .maybeSingle();

      if (existingMessage) {
        const response = { message: existingMessage };
        try {
          return MessageResponseSchema.parse(response);
        } catch (validationError) {
          console.error('Response validation failed:', validationError);
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
      console.error('Response validation failed:', validationError);
      throw createError({ statusCode: 500, statusMessage: 'Invalid response format' });
    }
  } catch (error: any) {
    throw error;
  }
});