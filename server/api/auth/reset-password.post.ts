import type { ResetPasswordPayload } from '~/types/auth';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const { email } = await readBody<ResetPasswordPayload>(event);
  const client = await serverSupabaseClient(event);

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${getRequestURL(event).origin}/auth/reset`
  });

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return { success: true };
});
