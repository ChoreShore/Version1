// Mock for the ofetch module (Nuxt's $fetch)
// This ensures $fetch calls in composables are intercepted by test mocks

export const $fetch = (...args: any[]) => {
  if (typeof (globalThis as any).$fetch === 'function') {
    return (globalThis as any).$fetch(...args);
  }
  return Promise.resolve({});
};

export default $fetch;
