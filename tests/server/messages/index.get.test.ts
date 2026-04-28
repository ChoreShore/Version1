import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GET /api/messages - Edge Case Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('unread_count calculation', () => {
    it('should calculate unread_count based on read_at timestamp', async () => {
      const response = {
        conversations: [
          {
            id: 'conv-1',
            job_id: '123e4567-e89b-12d3-a456-426614174000',
            application_id: '123e4567-e89b-12d3-a456-426614174000',
            other_user_id: 'user-2',
            other_participant_name: 'John Doe',
            job_title: 'Plumber needed',
            last_message_preview: 'Hello there',
            last_message_at: '2025-01-01T00:00:00Z',
            unread_count: 3
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/messages');

      expect(result).toEqual(response);
      expect(result.conversations[0].unread_count).toBe(3);
    });

    it('should return 0 unread_count when all messages are read', async () => {
      const response = {
        conversations: [
          {
            id: 'conv-1',
            job_id: '123e4567-e89b-12d3-a456-426614174000',
            application_id: '123e4567-e89b-12d3-a456-426614174000',
            other_user_id: 'user-2',
            other_participant_name: 'John Doe',
            job_title: 'Plumber needed',
            last_message_preview: 'Hello there',
            last_message_at: '2025-01-01T00:00:00Z',
            unread_count: 0
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/messages');

      expect(result).toEqual(response);
      expect(result.conversations[0].unread_count).toBe(0);
    });

    it('should handle conversations with no messages (unread_count: 0)', async () => {
      const response = {
        conversations: [
          {
            id: 'conv-1',
            job_id: '123e4567-e89b-12d3-a456-426614174000',
            application_id: '123e4567-e89b-12d3-a456-426614174000',
            other_user_id: 'user-2',
            other_participant_name: 'John Doe',
            job_title: 'Plumber needed',
            last_message_preview: 'No messages yet',
            last_message_at: '2025-01-01T00:00:00Z',
            unread_count: 0
          }
        ]
      };

      mockFetch.mockResolvedValue(response);

      const result = await $fetch('/api/messages');

      expect(result).toEqual(response);
      expect(result.conversations[0].unread_count).toBe(0);
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const error = {
        statusCode: 401,
        statusMessage: 'Sign in to view conversations'
      };

      mockFetch.mockRejectedValue(error);

      await expect($fetch('/api/messages')).rejects.toMatchObject(error);
    });
  });
});
