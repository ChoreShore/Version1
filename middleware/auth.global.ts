export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();

  // Public routes that don't require authentication
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

  const isPublicJobDetail = to.path.startsWith('/jobs/') && to.path !== '/jobs/new';
  const isPublicWorkerDetail = to.path.startsWith('/workers/') && to.path !== '/workers/new';

  // Allow access to public routes regardless of auth state
  if (publicRoutes.includes(to.path) || isPublicJobDetail || isPublicWorkerDetail) {
    return;
  }

  // If no user is authenticated, redirect to sign-in (or sign-up for job creation)
  if (!user.value) {
    const redirectTo = to.path === '/jobs/new' ? '/auth/sign-up' : '/auth/sign-in';
    return navigateTo(redirectTo, { replace: true });
  }
});
