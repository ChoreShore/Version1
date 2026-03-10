import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMessages } from '~/composables/useMessages';
import type {
  CreateMessageInput,
  ConversationsResponseInput,
  MessagesResponseInput,
  MessageResponseInput
} from '~/schemas/message';

const messagesComposable = useMessages();
const mockFetch = vi.fn();

describe('useMessages composable', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  it('listConversations fetches user conversations', async () => {
    const response: ConversationsResponseInput = {
      conversations: []
    };

    mockFetch.mockResolvedValue(response);

    const result = await messagesComposable.listConversations();

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/messages', { params: undefined });
  });

  it('getJobMessages fetches messages for a job', async () => {
    const response: MessagesResponseInput = {
      messages: []
    };

    mockFetch.mockResolvedValue(response);

    const result = await messagesComposable.getJobMessages('job-1');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/messages/job-1');
  });

  it('sendMessage posts payload to /api/messages', async () => {
    const response: MessageResponseInput = {
      message: {
        id: 'msg-1',
        job_id: 'job-1',
        application_id: 'app-1',
        sender_id: 'user-1',
        receiver_id: 'user-2',
        body: 'Hello there',
        attachment_url: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValue(response);

    const payload = {
      job_id: 'job-1',
      application_id: 'app-1',
      receiver_id: 'user-2',
      body: 'Hello there'
    };

    const result = await messagesComposable.sendMessage(payload);

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith('/api/messages', {
      method: 'POST',
      body: payload
    });
  });
});
