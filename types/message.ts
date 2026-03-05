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

export interface ConversationsResponse {
  conversations: Array<{
    job_id: string;
    application_id: string;
    last_message: MessageWithProfiles | null;
    unread_count: number;
  }>;
}