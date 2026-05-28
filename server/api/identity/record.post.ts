import { serverSupabaseClient } from '#supabase/server';
import { validateIdentityRecord } from '~/schemas/identity';
import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event, 'Sign in to continue');

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
