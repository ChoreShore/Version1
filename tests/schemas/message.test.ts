import { describe, it, expect } from 'vitest';
import {
  CreateMessageSchema,
  MessageSchema,
  ConversationSummarySchema,
  validateCreateMessage
} from '~/schemas/message';

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

const validMessage = () => ({
  job_id: VALID_UUID,
  application_id: VALID_UUID,
  receiver_id: VALID_UUID,
  body: 'Hello, this is a valid message'
});

// ─── CreateMessageSchema ─────────────────────────────────────────────────────────

describe('CreateMessageSchema', () => {
  it('accepts a fully valid message', () => {
    expect(CreateMessageSchema.safeParse(validMessage()).success).toBe(true);
  });

  describe('job_id', () => {
    it('rejects a non-UUID job_id', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), job_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid job ID format/i);
    });

    it('accepts a valid UUID', () => {
      expect(CreateMessageSchema.safeParse(validMessage()).success).toBe(true);
    });
  });

  describe('application_id', () => {
    it('rejects a non-UUID application_id', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), application_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid application ID format/i);
    });
  });

  describe('receiver_id', () => {
    it('rejects a non-UUID receiver_id', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), receiver_id: 'not-a-uuid' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid receiver ID format/i);
    });
  });

  describe('body', () => {
    it('rejects an empty body', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), body: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toBe('Please enter a message');
    });

    it('rejects a body over 2000 characters', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), body: 'a'.repeat(2001) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 2000 characters/i);
    });

    it('trims whitespace from body', () => {
      const result = CreateMessageSchema.safeParse({ ...validMessage(), body: '  Hello  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.body).toBe('Hello');
    });
  });

  describe('attachment_url', () => {
    it('accepts a valid URL from trusted domain', () => {
      const result = CreateMessageSchema.safeParse({ 
        ...validMessage(), 
        attachment_url: 'https://your-bucket.supabase.co/file.pdf' 
      });
      expect(result.success).toBe(true);
    });

    it('rejects an invalid URL', () => {
      const result = CreateMessageSchema.safeParse({ 
        ...validMessage(), 
        attachment_url: 'not-a-url' 
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid attachment URL/i);
    });

    it('accepts undefined (optional field)', () => {
      const result = CreateMessageSchema.safeParse(validMessage());
      expect(result.success).toBe(true);
    });
  });

  describe('client_message_id', () => {
    it('accepts a valid UUID', () => {
      const result = CreateMessageSchema.safeParse({ 
        ...validMessage(), 
        client_message_id: VALID_UUID 
      });
      expect(result.success).toBe(true);
    });

    it('rejects a non-UUID client_message_id', () => {
      const result = CreateMessageSchema.safeParse({ 
        ...validMessage(), 
        client_message_id: 'not-a-uuid' 
      });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/Invalid client message ID format/i);
    });

    it('accepts undefined (optional field)', () => {
      const result = CreateMessageSchema.safeParse(validMessage());
      expect(result.success).toBe(true);
    });
  });
});

// ─── MessageSchema ─────────────────────────────────────────────────────────────

describe('MessageSchema', () => {
  it('accepts a full message with all fields', () => {
    const message = {
      id: VALID_UUID,
      job_id: VALID_UUID,
      application_id: VALID_UUID,
      sender_id: VALID_UUID,
      receiver_id: VALID_UUID,
      body: 'Test message',
      attachment_url: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      sent_at: '2025-01-01T00:00:00Z',
      client_message_id: VALID_UUID
    };
    expect(MessageSchema.safeParse(message).success).toBe(true);
  });

  it('accepts a message with optional fields omitted', () => {
    const message = {
      id: VALID_UUID,
      job_id: VALID_UUID,
      application_id: VALID_UUID,
      sender_id: VALID_UUID,
      receiver_id: VALID_UUID,
      body: 'Test message',
      attachment_url: null
    };
    expect(MessageSchema.safeParse(message).success).toBe(true);
  });

  it('accepts client_message_id as optional', () => {
    const message = {
      id: VALID_UUID,
      job_id: VALID_UUID,
      application_id: VALID_UUID,
      sender_id: VALID_UUID,
      receiver_id: VALID_UUID,
      body: 'Test message',
      attachment_url: null
    };
    const result = MessageSchema.safeParse(message);
    expect(result.success).toBe(true);
  });
});

// ─── ConversationSummarySchema ───────────────────────────────────────────────

describe('ConversationSummarySchema', () => {
  it('accepts a valid conversation summary', () => {
    const conv = {
      id: VALID_UUID,
      job_id: VALID_UUID,
      application_id: VALID_UUID,
      last_message_at: '2025-01-01T00:00:00Z',
      unread_count: 5,
      job_title: 'Plumber needed',
      other_participant_name: 'John Doe',
      other_user_id: VALID_UUID,
      last_message_preview: 'Hello there'
    };
    expect(ConversationSummarySchema.safeParse(conv).success).toBe(true);
  });

  it('accepts a conversation with optional fields omitted', () => {
    const conv = {
      id: VALID_UUID,
      job_id: VALID_UUID,
      application_id: VALID_UUID,
      last_message_at: '2025-01-01T00:00:00Z'
    };
    expect(ConversationSummarySchema.safeParse(conv).success).toBe(true);
  });
});

// ─── validateCreateMessage helper ───────────────────────────────────────────────

describe('validateCreateMessage', () => {
  it('returns success:true with parsed data for a valid message', () => {
    const result = validateCreateMessage(validMessage());
    expect(result.success).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.errors).toBeNull();
  });

  it('returns success:false with field errors for an invalid job_id', () => {
    const result = validateCreateMessage({ ...validMessage(), job_id: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('job_id');
  });

  it('returns success:false with field errors for an empty body', () => {
    const result = validateCreateMessage({ ...validMessage(), body: '' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('body');
  });

  it('returns success:false with field errors for an invalid attachment_url', () => {
    const result = validateCreateMessage({ ...validMessage(), attachment_url: 'not-a-url' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('attachment_url');
  });
});
