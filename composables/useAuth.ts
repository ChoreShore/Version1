import type { SignUpInput, SignInInput, Role, UpdatePasswordInput, DeleteAccountInput } from '~/schemas/auth';

function normalizeFetchError(error: any): never {
  const message = error?.statusMessage || error?.message || 'Something went wrong';
  throw new Error(message);
}

export const useAuth = () => {
  const user = useSupabaseUser();

  const signup = async (payload: SignUpInput) => {
    try {
      await $fetch('/api/auth/signup', { method: 'POST', body: payload });
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const signin = async (payload: SignInInput) => {
    try {
      await $fetch('/api/auth/signin', { method: 'POST', body: payload });
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const addRole = async (role: Role) => {
    try {
      const data = await $fetch<{ roles: Role[] }>(
        '/api/auth/add-role',
        { method: 'POST', body: { role } }
      );
      return data;
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { email }
      });
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const updatePassword = async (payload: UpdatePasswordInput) => {
    try {
      const data = await $fetch<{ success: boolean; message: string }>(
        '/api/auth/update-password',
        { method: 'POST', body: payload }
      );
      return data;
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const deleteAccount = async (payload: DeleteAccountInput) => {
    try {
      const data = await $fetch<{ success: boolean; message: string }>(
        '/api/auth/delete-account',
        { method: 'DELETE', body: payload }
      );
      return data;
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  const signout = async () => {
    try {
      const data = await $fetch<{ success: boolean }>(
        '/api/auth/signout', 
        { method: 'POST' }
      );
      return data;
    } catch (error) {
      normalizeFetchError(error);
    }
  };

  return { user, signup, signin, addRole, resetPassword, updatePassword, deleteAccount, signout };
};
