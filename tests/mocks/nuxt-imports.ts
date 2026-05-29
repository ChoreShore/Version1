// Mock file for Nuxt's #imports virtual module
// This provides all the auto-imported composables and utilities used in the app

import { ref } from 'vue';
import { createSupabaseMock } from './createSupabaseMock';

export const useSupabaseUser = () => ref(null);
export const useSupabaseClient = () => createSupabaseMock();
export const useRoute = () => ({ path: '/', params: {}, query: {} });
export const useRouter = () => ({ push: () => {}, replace: () => {}, go: () => {}, back: () => {}, forward: () => {} });
export const useRuntimeConfig = () => ({ public: {} });
export const definePageMeta = () => {};
export const navigateTo = () => {};
export const onUnmounted = (fn: () => void) => {};

// $fetch mock - delegate to globalThis.$fetch if set by tests
export const $fetch = (...args: any[]) => {
  if (typeof (globalThis as any).$fetch === 'function') {
    return (globalThis as any).$fetch(...args);
  }
  return Promise.resolve({});
};

// Custom composables
export const useActiveRole = () => ({ role: ref('worker') });
export const useJobs = () => ({
  listJobs: () => Promise.resolve({ jobs: [] }),
  findNearbyJobs: () => Promise.resolve({ jobs: [] }),
  getJob: () => Promise.resolve({ job: null })
});
export const useApplications = () => ({
  listMyApplications: () => Promise.resolve({ applications: [] }),
  getApplication: () => Promise.resolve({ application: null })
});
export const useContracts = () => ({
  getContract: () => Promise.resolve({ contract: null }),
  listContracts: () => Promise.resolve({ contracts: [] })
});
export const useMessages = () => ({
  listConversations: () => Promise.resolve({ conversations: [] }),
  getMessages: () => Promise.resolve({ messages: [] })
});
export const usePayments = () => ({
  createPaymentIntent: () => Promise.resolve({ intent: null }),
  confirmPayment: () => Promise.resolve({ payment: null })
});
export const useAuth = () => ({
  user: ref(null),
  signup: () => Promise.resolve({ user: { id: 'user-1' } }),
  signIn: () => Promise.resolve({ user: { id: 'user-1' } }),
  signOut: () => Promise.resolve({}),
  deleteAccount: () => Promise.resolve({}),
  updatePassword: () => Promise.resolve({ message: 'Password updated' }),
  addRole: () => Promise.resolve(['employer', 'worker'])
});
export const useGeolocation = () => ({
  getCurrentPosition: () => Promise.resolve({ coords: { latitude: 51.5, longitude: -0.1 } }),
  watchPosition: () => () => {}
});
export const useDirtyForm = () => ({
  isDirty: ref(false),
  reset: () => {}
});

