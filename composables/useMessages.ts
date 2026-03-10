import type {
  CreateMessageInput,
  MessageResponseInput,
  ConversationsResponseInput,
  MessagesResponseInput
} from '~/schemas/message';
import type { Role } from '~/schemas/role';

export const useMessages = () => {
  const listConversations = async (role?: Role) => {
    return await $fetch<ConversationsResponseInput>('/api/messages', {
      params: role ? { role } : undefined
    });
  };

  const getJobMessages = async (jobId: string) => {
    return await $fetch<MessagesResponseInput>(`/api/messages/${jobId}`);
  };

  const sendMessage = async (payload: CreateMessageInput) => {
    return await $fetch<MessageResponseInput>('/api/messages', {
      method: 'POST',
      body: payload
    });
  };

  return {
    listConversations,
    getJobMessages,
    sendMessage
  };
};
