import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('POST /api/messages - Edge Case Fixes', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as any).$fetch = mockFetch;
  });

  describe('Application status check', () => {
    it('should prevent sending messages on closed/rejected applications', async () => {
      const error = {
        statusCode: 403,
        statusMessage: 'Messaging disabled for this application status'
      };

      mockFetch.mockRejectedValue(error);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'This should fail'
      };

      await expect(
        $fetch('/api/messages', {
          method: 'POST',
          body: payload
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow sending messages on pending applications', async () => {
      const response = {
        message: {
          id: 'msg-1',
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          application_id: '123e4567-e89b-12d3-a456-426614174000',
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
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Hello there'
      };

      const result = await $fetch('/api/messages', {
        method: 'POST',
        body: payload
      });

      expect(result).toEqual(response);
    });
  });

  describe('Idempotency with client_message_id', () => {
    it('should return existing message if client_message_id matches', async () => {
      const existingMessage = {
        message: {
          id: 'msg-1',
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          application_id: '123e4567-e89b-12d3-a456-426614174000',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          body: 'Hello there',
          attachment_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          client_message_id: '123e4567-e89b-12d3-a456-426614174001'
        }
      };

      mockFetch.mockResolvedValue(existingMessage);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Hello there',
        client_message_id: '123e4567-e89b-12d3-a456-426614174001'
      };

      const result = await $fetch('/api/messages', {
        method: 'POST',
        body: payload
      });

      expect(result).toEqual(existingMessage);
    });

    it('should create new message if client_message_id is new', async () => {
      const newMessage = {
        message: {
          id: 'msg-2',
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          application_id: '123e4567-e89b-12d3-a456-426614174000',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          body: 'New message',
          attachment_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          client_message_id: '123e4567-e89b-12d3-a456-426614174002'
        }
      };

      mockFetch.mockResolvedValue(newMessage);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'New message',
        client_message_id: '123e4567-e89b-12d3-a456-426614174002'
      };

      const result = await $fetch('/api/messages', {
        method: 'POST',
        body: payload
      });

      expect(result).toEqual(newMessage);
    });
  });

  describe('Rate limiting', () => {
    it('should rate limit excessive messages from same user', async () => {
      const error = {
        statusCode: 429,
        statusMessage: 'Too many messages. Please wait a moment before sending another.'
      };

      mockFetch.mockRejectedValue(error);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Too many messages'
      };

      await expect(
        $fetch('/api/messages', {
          method: 'POST',
          body: payload
        })
      ).rejects.toMatchObject(error);
    });

    it('should allow messages within rate limit', async () => {
      const response = {
        message: {
          id: 'msg-1',
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          application_id: '123e4567-e89b-12d3-a456-426614174000',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          body: 'Hello',
          attachment_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Hello'
      };

      const result = await $fetch('/api/messages', {
        method: 'POST',
        body: payload
      });

      expect(result).toEqual(response);
    });
  });

  describe('Attachment URL validation', () => {
    it('should reject invalid attachment URLs', async () => {
      const error = {
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: { attachment_url: 'Invalid attachment URL' } }
      };

      mockFetch.mockRejectedValue(error);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Message with attachment',
        attachment_url: 'not-a-valid-url'
      };

      await expect(
        $fetch('/api/messages', {
          method: 'POST',
          body: payload
        })
      ).rejects.toMatchObject(error);
    });

    it('should accept valid attachment URLs', async () => {
      const response = {
        message: {
          id: 'msg-1',
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          application_id: '123e4567-e89b-12d3-a456-426614174000',
          sender_id: 'user-1',
          receiver_id: 'user-2',
          body: 'Message with attachment',
          attachment_url: 'https://cdn.example.com/file.pdf',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      };

      mockFetch.mockResolvedValue(response);

      const payload = {
        job_id: '123e4567-e89b-12d3-a456-426614174000',
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        receiver_id: '123e4567-e89b-12d3-a456-426614174000',
        body: 'Message with attachment',
        attachment_url: 'https://cdn.example.com/file.pdf'
      };

      const result = await $fetch('/api/messages', {
        method: 'POST',
        body: payload
      });

      expect(result).toEqual(response);
    });
  });
});
