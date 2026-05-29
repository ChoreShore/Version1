export { createSupabaseMock } from './createSupabaseMock';

/** Re-export a default empty mock so existing imports don't break immediately. */
export const serverSupabaseUser = async () => null;

export const serverSupabaseClient = async () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => ({
            like: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    }),
  }),
});