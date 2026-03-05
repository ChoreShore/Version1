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