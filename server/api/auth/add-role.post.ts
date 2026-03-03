import type { AddRolePayload, Role } from '~/types/auth';
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  const { role } = await readBody<AddRolePayload>(event);
  const client = await serverSupabaseClient(event);

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw createError({ statusCode: 400, statusMessage: profileError.message });
  }

  const existingRoles = Array.isArray(profile?.roles) ? profile.roles : [];
  const roles = new Set<Role>(existingRoles);
  roles.add(role);

  const { error } = await client
    .from('profiles')
    .update({ roles: Array.from(roles) })
    .eq('id', user.id);

  if (error) {
    throw createError({ statusCode: 400, statusMessage: error.message });
  }

  return { roles: Array.from(roles) };
});
