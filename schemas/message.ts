import { z } from 'zod';

// Message creation schema (strict for input validation)
export const CreateMessageSchema = z.object({
  job_id: z.string().uuid('Invalid job ID format'),
  application_id: z.string().uuid('Invalid application ID format'),
  receiver_id: z.string().uuid('Invalid receiver ID format'),
  body: z.string()
    .min(1, 'Message body is required')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
  attachment_url: z.string().url('Invalid attachment URL').optional()
});

// Full message schema (lenient for database responses)
export const MessageSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  application_id: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  body: z.string(),
  attachment_url: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  sent_at: z.string().optional() // Add sent_at field for compatibility
});

// Message with details schema (lenient for database responses)
export const MessageWithDetailsSchema = MessageSchema.extend({
  sender_first_name: z.string().optional(),
  sender_last_name: z.string().optional(),
  job_title: z.string().optional()
});

// API response schemas (lenient for database responses)
export const MessagesResponseSchema = z.object({
  messages: MessageSchema.array()
});

export const MessageResponseSchema = z.object({
  message: z.union([MessageSchema, MessageWithDetailsSchema])
});

export const ConversationsResponseSchema = z.object({
  conversations: MessageWithDetailsSchema.array()
});

// Additional message types for compatibility
export const ConversationSummarySchema = z.object({
  id: z.string(),
  job_id: z.string(),
  application_id: z.string(),
  last_message: z.string(),
  last_message_at: z.string(),
  unread_count: z.number().optional(),
  other_user: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string()
  }).optional(),
  // Additional fields for compatibility with existing Vue pages
  job_title: z.string().optional(),
  other_participant_name: z.string().optional(),
  other_participant_id: z.string().optional(),
  other_user_id: z.string().optional(),
  other_user_first_name: z.string().optional(),
  other_user_last_name: z.string().optional(),
  last_message_preview: z.string().optional(),
  last_message_content: z.string().optional(),
  last_message_sent_at: z.string().optional()
});

export const MessageWithProfilesSchema = MessageSchema.extend({
  sender: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string()
  }).optional(),
  receiver: z.object({
    id: z.string(),
    first_name: z.string(),
    last_name: z.string()
  }).optional(),
  read_at: z.string().optional()
});

// Type exports
export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;
export type MessageInput = z.infer<typeof MessageSchema>;
export type MessageWithDetailsInput = z.infer<typeof MessageWithDetailsSchema>;
export type MessagesResponseInput = z.infer<typeof MessagesResponseSchema>;
export type MessageResponseInput = z.infer<typeof MessageResponseSchema>;
export type ConversationsResponseInput = z.infer<typeof ConversationsResponseSchema>;
export type ConversationSummary = z.infer<typeof ConversationSummarySchema>;
export type MessageWithProfiles = z.infer<typeof MessageWithProfilesSchema>;

// Validation helper functions
export const validateCreateMessage = (data: unknown) => {
  try {
    return {
      success: true,
      data: CreateMessageSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};
