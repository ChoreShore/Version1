import { getAuthenticatedUser } from '~/server/utils/api';
import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view your profile');
    const client = await serverSupabaseClient(event);

    // Fetch user's profile to get their roles
    const { data: profile } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single();

    return {
      user: {
        ...user,
        roles: profile?.roles || []
      }
    };
  } catch (error: any) {
    throw error;
  }
});
