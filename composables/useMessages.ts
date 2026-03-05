import type {
  CreateMessagePayload,
  MessageResponse,
  ConversationsResponse,
  JobMessagesResponse
} from '~/types/message';

export const useMessages = () => {
  const listConversations = async () => {
    return await $fetch<ConversationsResponse>('/api/messages');
  };

  const getJobMessages = async (jobId: string) => {
    return await $fetch<JobMessagesResponse>(`/api/messages/${jobId}`);
  };

  const sendMessage = async (payload: CreateMessagePayload) => {
    return await $fetch<MessageResponse>('/api/messages', {
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
