import { validateAddRole } from '~/schemas/auth';
import { serverSupabaseClient } from '#supabase/server';
import { getAuthenticatedUser } from '~/server/utils/api';
import { requireCsrfProtection } from '~/server/utils/csrf';

export default defineEventHandler(async (event) => {
  try {
    // Apply CSRF protection
    requireCsrfProtection(event);

    const user = await getAuthenticatedUser(event, 'Sign in to update your roles');

    const body = await readBody(event);
    
    // Validate request body with Zod
    const validation = validateAddRole(body);
    if (!validation.success || !validation.data) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Validation failed',
        data: { errors: validation.errors }
      });
    }

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
    const roles = new Set(existingRoles);
    roles.add(validation.data.role);

    const { error } = await client
      .from('profiles')
      .update({ roles: Array.from(roles) })
      .eq('id', user.id);

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return { roles: Array.from(roles) };
  } catch (error: any) {
    throw error;
  }
});
