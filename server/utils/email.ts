import { Resend } from 'resend';
import type { H3Event } from 'h3';
import { logger } from '~/server/utils/logger';

const runtimeConfig = useRuntimeConfig();
const resend = new Resend(runtimeConfig.resendApiKey);

interface SendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  idempotencyKey: string;
}

export async function sendEmail({ from, to, subject, html, idempotencyKey }: SendEmailOptions) {
  const { data, error } = await resend.emails.send(
    { from, to, subject, html },
    { idempotencyKey }
  );

  if (error) {
    logger.error('Failed to send email', error, 'email');
    throw new Error(error.message);
  }

  logger.info(`Email sent: ${data?.id}`, 'email');
  return data;
}

interface UserDetails {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export async function getUserDetails(event: H3Event, userId: string): Promise<UserDetails> {
  const { serverSupabaseServiceRole } = await import('#supabase/server');
  const serviceClient = await serverSupabaseServiceRole(event);

  const [{ data: authData, error: authError }, { data: profile }] = await Promise.all([
    serviceClient.auth.admin.getUserById(userId),
    serviceClient.from('profiles').select('first_name, last_name').eq('id', userId).maybeSingle()
  ]);

  if (authError) {
    logger.error('Failed to fetch user auth details', authError, 'email');
  }

  return {
    email: authData?.user?.email ?? null,
    firstName: (profile as any)?.first_name ?? null,
    lastName: (profile as any)?.last_name ?? null
  };
}

export async function sendNotificationEmail(
  event: H3Event,
  {
    userId,
    subject,
    html,
    idempotencyKey
  }: {
    userId: string;
    subject: string;
    html: string;
    idempotencyKey: string;
  }
) {
  const user = await getUserDetails(event, userId);
  if (!user.email) {
    logger.warn(`No email found for user ${userId}, skipping notification`, 'email');
    return null;
  }

  try {
    return await sendEmail({
      from: 'ChoreShore <notifications@choreshore.com>',
      to: user.email,
      subject,
      html,
      idempotencyKey
    });
  } catch (error) {
    logger.error('Notification email failed', error, 'email');
    return null;
  }
}
