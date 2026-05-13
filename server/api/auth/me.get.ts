import { getAuthenticatedUser } from '~/server/utils/api';

export default defineEventHandler(async (event) => {
  try {
    const user = await getAuthenticatedUser(event, 'Sign in to view your profile');
    return { user };
  } catch (error: any) {
    throw error;
  }
});
