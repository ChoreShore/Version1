import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockSendEmail = vi.fn();
  const MockResendClass = vi.fn(function Resend(this: any) {
    this.emails = { send: mockSendEmail };
  }) as any;

  const mockGetUserById = vi.fn();
  const mockProfileSelect = vi.fn();
  const mockServiceClient = vi.fn(() => ({
    auth: { admin: { getUserById: mockGetUserById } },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }));

  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  };

  (globalThis as any).useRuntimeConfig = vi.fn(() => ({
    resendApiKey: 'test-resend-key'
  }));

  return {
    mockSendEmail,
    MockResendClass,
    mockServiceClient,
    mockGetUserById,
    mockProfileSelect,
    mockLogger
  };
});

vi.mock('resend', () => ({
  Resend: mocks.MockResendClass
}));

vi.mock('#supabase/server', () => ({
  serverSupabaseServiceRole: mocks.mockServiceClient
}));

vi.mock('~/server/utils/logger', () => ({
  logger: mocks.mockLogger
}));

import { sendEmail, getUserDetails, sendNotificationEmail } from '~/server/utils/email';

const mockEvent = {} as any;

describe('sendEmail', () => {
  beforeEach(() => {
    mocks.mockSendEmail.mockReset();
    mocks.mockLogger.info.mockReset();
    mocks.mockLogger.error.mockReset();
  });

  it('sends an email via Resend and returns the data', async () => {
    const emailData = { id: 'email-123' };
    mocks.mockSendEmail.mockResolvedValue({ data: emailData, error: null });

    const result = await sendEmail({
      from: 'Test <test@example.com>',
      to: 'user@example.com',
      subject: 'Hello',
      html: '<p>World</p>',
      idempotencyKey: 'key-1'
    });

    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      { from: 'Test <test@example.com>', to: 'user@example.com', subject: 'Hello', html: '<p>World</p>' },
      { idempotencyKey: 'key-1' }
    );
    expect(result).toEqual(emailData);
    expect(mocks.mockLogger.info).toHaveBeenCalledWith('Email sent: email-123', 'email');
  });

  it('throws when Resend returns an error', async () => {
    mocks.mockSendEmail.mockResolvedValue({ data: null, error: { message: 'Rate limited' } });

    await expect(
      sendEmail({
        from: 'Test <test@example.com>',
        to: 'user@example.com',
        subject: 'Hello',
        html: '<p>World</p>',
        idempotencyKey: 'key-1'
      })
    ).rejects.toThrow('Rate limited');

    expect(mocks.mockLogger.error).toHaveBeenCalled();
  });
});

describe('getUserDetails', () => {
  beforeEach(() => {
    mocks.mockGetUserById.mockReset();
    mocks.mockServiceClient.mockClear();
    mocks.mockLogger.error.mockReset();
  });

  it('returns email and names from auth and profile', async () => {
    const authUser = { email: 'user@example.com' };
    const profile = { first_name: 'Jane', last_name: 'Doe' };

    mocks.mockGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: profile, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    const result = await getUserDetails(mockEvent, 'user-1');

    expect(result).toEqual({
      email: 'user@example.com',
      firstName: 'Jane',
      lastName: 'Doe'
    });
  });

  it('returns null values when auth lookup fails', async () => {
    mocks.mockGetUserById.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' }
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    const result = await getUserDetails(mockEvent, 'user-1');

    expect(result).toEqual({ email: null, firstName: null, lastName: null });
    expect(mocks.mockLogger.error).toHaveBeenCalledWith(
      'Failed to fetch user auth details',
      { message: 'Auth error' },
      'email'
    );
  });

  it('returns null profile fields when profile is missing', async () => {
    const authUser = { email: 'user@example.com' };
    mocks.mockGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    const result = await getUserDetails(mockEvent, 'user-1');

    expect(result).toEqual({ email: 'user@example.com', firstName: null, lastName: null });
  });
});

describe('sendNotificationEmail', () => {
  beforeEach(() => {
    mocks.mockSendEmail.mockReset();
    mocks.mockGetUserById.mockReset();
    mocks.mockServiceClient.mockClear();
    mocks.mockLogger.warn.mockReset();
    mocks.mockLogger.error.mockReset();
  });

  it('sends a notification email when user has an email', async () => {
    const authUser = { email: 'user@example.com' };
    mocks.mockGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    mocks.mockSendEmail.mockResolvedValue({ data: { id: 'notif-1' }, error: null });

    const result = await sendNotificationEmail(mockEvent, {
      userId: 'user-1',
      subject: 'Job update',
      html: '<p>Your job was updated</p>',
      idempotencyKey: 'key-notif-1'
    });

    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'ChoreShore <notifications@choreshore.com>',
        to: 'user@example.com',
        subject: 'Job update',
        html: '<p>Your job was updated</p>'
      }),
      { idempotencyKey: 'key-notif-1' }
    );
    expect(result).toEqual({ id: 'notif-1' });
  });

  it('returns null and logs a warning when user has no email', async () => {
    mocks.mockGetUserById.mockResolvedValue({ data: { user: null }, error: null });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    const result = await sendNotificationEmail(mockEvent, {
      userId: 'user-no-email',
      subject: 'Job update',
      html: '<p>Your job was updated</p>',
      idempotencyKey: 'key-notif-2'
    });

    expect(result).toBeNull();
    expect(mocks.mockSendEmail).not.toHaveBeenCalled();
    expect(mocks.mockLogger.warn).toHaveBeenCalledWith(
      'No email found for user user-no-email, skipping notification',
      'email'
    );
  });

  it('returns null and logs an error when sendEmail throws', async () => {
    const authUser = { email: 'user@example.com' };
    mocks.mockGetUserById.mockResolvedValue({ data: { user: authUser }, error: null });

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

    mocks.mockServiceClient.mockResolvedValue({
      auth: { admin: { getUserById: mocks.mockGetUserById } },
      from: mockFrom
    });

    mocks.mockSendEmail.mockRejectedValue(new Error('SMTP down'));

    const result = await sendNotificationEmail(mockEvent, {
      userId: 'user-1',
      subject: 'Job update',
      html: '<p>Your job was updated</p>',
      idempotencyKey: 'key-notif-3'
    });

    expect(result).toBeNull();
    expect(mocks.mockLogger.error).toHaveBeenCalledWith(
      'Notification email failed',
      expect.any(Error),
      'email'
    );
  });
});
