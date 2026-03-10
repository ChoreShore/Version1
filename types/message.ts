export type MessageRecipientRole = 'worker' | 'employer';

export interface Message {
  id: string;
  job_id: string;
  application_id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  attachment_url?: string | null;
  sent_at: string;
  created_at?: string;
  read_at?: string | null;
}

export interface MessageWithProfiles extends Message {
  sender?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
  };
  receiver?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

export interface CreateMessagePayload {
  job_id: string;
  application_id: string;
  receiver_id: string;
  body: string;
  attachment_url?: string;
}

export interface MessageResponse {
  message: MessageWithProfiles;
}

export interface MessagesResponse {
  messages: MessageWithProfiles[];
}

export interface JobMessagesResponse {
  messages: MessageWithProfiles[];
}

export interface ConversationSummary {
  id?: string;
  job_id: string;
  job_title?: string | null;
  application_id: string;
  other_participant_id?: string;
  other_participant_name?: string | null;
  other_user_id?: string;
  other_user_first_name?: string | null;
  other_user_last_name?: string | null;
  last_message_preview?: string | null;
  last_message_content?: string | null;
  last_message_at?: string | null;
  last_message_sent_at?: string | null;
  unread_count?: number;
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
}