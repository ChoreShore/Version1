const publicRoutes = [
  '/',
  '/jobs',
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/reset-password',
  '/auth/complete-profile',
  '/terms',
  '/privacy',
  '/safety',
  '/refund',
  '/cookies',
  '/about',
  '/contact'
];

const publicPrefixes = ['/jobs/', '/workers/'];

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  const isPublic =
    publicRoutes.includes(to.path) ||
    publicPrefixes.some((prefix) => to.path.startsWith(prefix));

  if (isPublic) {
    return;
  }

  if (!user.value) {
    const redirectTo = to.path === '/jobs/new' ? '/auth/sign-up' : '/auth/sign-in';
    return navigateTo(redirectTo, { replace: true });
  }
});
