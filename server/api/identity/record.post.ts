import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import { validateIdentityRecord } from '~/schemas/identity';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to continue' });
  }

  const body = await readBody(event);
  const validation = validateIdentityRecord(body);

  if (!validation.success || !validation.data) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation failed',
      data: { errors: validation.errors }
    });
  }

  const { status, sessionId, verifiedAt } = validation.data;

  const client = await serverSupabaseClient(event);
  const { error } = await client.auth.updateUser({
    data: {
      identity_verification: {
        status,
        sessionId,
        verifiedAt: verifiedAt ?? new Date().toISOString()
      }
    }
  });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  return { success: true, status, sessionId };
});
