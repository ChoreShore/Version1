import type { SignUpPayload, SignInPayload, Role } from '~/types/auth';

export const useAuth = () => {
  const user = useSupabaseUser();

  const signup = async (payload: SignUpPayload) => {
    await $fetch('/api/auth/signup', { method: 'POST', body: payload });
  };

  const signin = async (payload: SignInPayload) => {
    await $fetch('/api/auth/signin', { method: 'POST', body: payload });
  };

  const addRole = async (role: Role) => {
    const data = await $fetch<{ roles: Role[] }>(
      '/api/auth/add-role',
      { method: 'POST', body: { role } }
    );
    return data.roles;
  };

  const resetPassword = async (email: string) => {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { email }
    });
  };

  const signout = async () => {
    await $fetch('/api/auth/signout', { method: 'POST' });
  };

  return { user, signup, signin, addRole, resetPassword, signout };
};
