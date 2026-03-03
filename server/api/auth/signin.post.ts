import type { SignInPayload } from '~/types/auth';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const body = await readBody<SignInPayload>(event);
  const client = await serverSupabaseClient(event);

  const { data, error } = await client.auth.signInWithPassword(body);

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return { user: data.user, session: data.session };
});
