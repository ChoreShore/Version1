/**
 * Fluent Supabase mock builder for Vitest route tests.
 *
 * Supports every chain method used in the codebase:
 *   select / insert / update / delete / rpc
 *   eq / neq / in / like / order / limit / range
 *   single / maybeSingle / count(head)
 *
 * Usage in a test:
 *   import { createSupabaseMock } from './createSupabaseMock';
 *   const mockClient = createSupabaseMock({
 *     from: {
 *       jobs: { select: [{ id: 'job-1', title: 'Test' }] },
 *       profiles: { single: { id: 'user-1', roles: ['employer'] } },
 *     },
 *     rpc: { find_jobs_near: [{ id: 'job-1' }] },
 *   });
 *   vi.mocked(serverSupabaseClient).mockResolvedValue(mockClient);
 */

export interface SupabaseMockConfig {
  /** Global fallback when no table-specific config matches */
  defaultData?: any;
  defaultError?: any;

  /** Per-table responses keyed by table name */
  from?: Record<
    string,
    {
      /** Data returned by `.select().*...` (array) */
      select?: any[];
      /** Data returned by `.single()` on this table */
      single?: any;
      /** Data returned by `.maybeSingle()` on this table */
      maybeSingle?: any;
      /** Data returned by count queries `{ count: 'exact', head: true }` */
      count?: number;
      /** Data returned by `.insert().select().single()` */
      insertSingle?: any;
      /** Error returned for any operation on this table */
      error?: any;
    }
  >;

  /** Per-RPC function responses keyed by function name */
  rpc?: Record<string, any>;
  /** Default RPC error */
  rpcError?: any;

  /** Auth responses */
  auth?: {
    signUp?: { data?: any; error?: any };
    signInWithPassword?: { data?: any; error?: any };
    signOut?: { error?: any };
    resetPasswordForEmail?: { error?: any };
    updateUser?: { error?: any };
    getUser?: { data?: any; error?: any };
    admin?: {
      deleteUser?: { error?: any };
    };
  };

  /** Storage responses */
  storage?: {
    listBuckets?: any[];
    from?: Record<
      string,
      {
        upload?: { data?: any; error?: any };
        remove?: { data?: any; error?: any };
        getPublicUrl?: { data?: { publicUrl: string } };
      }
    >;
  };
}

export function createSupabaseMock(config: SupabaseMockConfig = {}) {
  const tableConfig = config.from ?? {};
  const rpcConfig = config.rpc ?? {};
  const authConfig = config.auth ?? {};
  const storageConfig = config.storage ?? {};

  // Track which tables were queried so tests can assert
  const accessedTables = new Set<string>();

  function getTableData(table: string, mode: 'select' | 'single' | 'maybeSingle' | 'count' | 'insertSingle') {
    accessedTables.add(table);
    const t = tableConfig[table];
    if (t?.error) return { data: null, error: t.error };
    if (mode === 'count') return { data: null, error: null, count: t?.count ?? 0 };
    const value = t?.[mode] ?? (mode === 'select' ? [] : null);
    return { data: value, error: null };
  }

  function makeQueryBuilder(table: string) {
    // Internal accumulator for filters (not used for logic, but kept for extensibility)
    let _filters: Array<{ op: string; column: string; value: any }> = [];

    const builder: any = {
      eq(column: string, value: any) {
        _filters.push({ op: 'eq', column, value });
        return builder;
      },
      neq(column: string, value: any) {
        _filters.push({ op: 'neq', column, value });
        return builder;
      },
      in(column: string, values: any[]) {
        _filters.push({ op: 'in', column, value: values });
        return builder;
      },
      like(column: string, pattern: string) {
        _filters.push({ op: 'like', column, value: pattern });
        return builder;
      },
      ilike(column: string, pattern: string) {
        _filters.push({ op: 'ilike', column, value: pattern });
        return builder;
      },
      gte(column: string, value: any) {
        _filters.push({ op: 'gte', column, value });
        return builder;
      },
      lte(column: string, value: any) {
        _filters.push({ op: 'lte', column, value });
        return builder;
      },
      gt(column: string, value: any) {
        _filters.push({ op: 'gt', column, value });
        return builder;
      },
      select(_columns?: string | string[]) {
        return builder;
      },
      order(column: string, _opts?: any) {
        return builder;
      },
      limit(n: number) {
        return builder;
      },
      range(from: number, to: number) {
        return builder;
      },
      or(_filters: string) {
        return builder;
      },
      single() {
        return Promise.resolve(getTableData(table, 'single'));
      },
      maybeSingle() {
        return Promise.resolve(getTableData(table, 'maybeSingle'));
      },
    };

    // Make the builder itself thenable so `await client.from('x').select()` works
    builder.then = (onFulfilled?: any, onRejected?: any) => {
      return Promise.resolve(getTableData(table, 'select')).then(onFulfilled, onRejected);
    };

    return builder;
  }

  return {
    _accessedTables: accessedTables,

    from(table: string) {
      accessedTables.add(table);
      const t = tableConfig[table];
      const hasError = t?.error;

      return {
        select(columns?: string | string[], opts?: { count?: string; head?: boolean }) {
          if (opts?.count === 'exact' && opts?.head) {
            return {
              eq() { return this; },
              neq() { return this; },
              in() { return this; },
              then(onFulfilled?: any, onRejected?: any) {
                const result = getTableData(table, 'count');
                return Promise.resolve({ data: null, error: hasError ?? null, count: result.count }).then(onFulfilled, onRejected);
              },
            };
          }
          return makeQueryBuilder(table);
        },

        update(_values: any) {
          const updateBuilder: any = {
            eq() { return updateBuilder; },
            neq() { return updateBuilder; },
            in() { return updateBuilder; },
            select() { return makeQueryBuilder(table); },
            then(onFulfilled?: any, onRejected?: any) {
              return Promise.resolve({ data: null, error: hasError ?? null }).then(onFulfilled, onRejected);
            },
          };
          return updateBuilder;
        },

        insert(_values: any | any[]) {
          return {
            select() {
              return {
                single() {
                  return Promise.resolve(getTableData(table, 'insertSingle'));
                },
                then(onFulfilled?: any, onRejected?: any) {
                  return Promise.resolve(getTableData(table, 'insertSingle')).then(onFulfilled, onRejected);
                },
              };
            },
            then(onFulfilled?: any, onRejected?: any) {
              return Promise.resolve({ data: null, error: hasError ?? null }).then(onFulfilled, onRejected);
            },
          };
        },

        upsert(_values: any | any[], _opts?: any) {
          return {
            select() {
              return {
                single() {
                  return Promise.resolve(getTableData(table, 'insertSingle'));
                },
                then(onFulfilled?: any, onRejected?: any) {
                  return Promise.resolve(getTableData(table, 'insertSingle')).then(onFulfilled, onRejected);
                },
              };
            },
            then(onFulfilled?: any, onRejected?: any) {
              return Promise.resolve({ data: null, error: hasError ?? null }).then(onFulfilled, onRejected);
            },
          };
        },

        delete() {
          return {
            eq() { return this; },
            in() { return this; },
            then(onFulfilled?: any, onRejected?: any) {
              return Promise.resolve({ data: null, error: hasError ?? null }).then(onFulfilled, onRejected);
            },
          };
        },
      };
    },

    rpc(name: string, _params?: any) {
      if (config.rpcError) {
        return Promise.resolve({ data: null, error: config.rpcError });
      }
      const data = rpcConfig[name] ?? config.defaultData ?? null;
      return Promise.resolve({ data, error: null });
    },

    auth: {
      signUp: () => Promise.resolve(authConfig.signUp ?? { data: { user: { id: 'user-1' } }, error: null }),
      signInWithPassword: () => Promise.resolve(authConfig.signInWithPassword ?? { data: { user: { id: 'user-1' } }, error: null }),
      signOut: () => Promise.resolve(authConfig.signOut ?? { error: null }),
      resetPasswordForEmail: () => Promise.resolve(authConfig.resetPasswordForEmail ?? { error: null }),
      updateUser: () => Promise.resolve(authConfig.updateUser ?? { error: null }),
      getUser: () => Promise.resolve(authConfig.getUser ?? { data: { user: { id: 'user-1' } }, error: null }),
      admin: {
        deleteUser: () => Promise.resolve(authConfig.admin?.deleteUser ?? { error: null }),
      },
    },

    storage: {
      listBuckets: () => Promise.resolve(storageConfig.listBuckets ?? []),
      from(bucket: string) {
        const bucketCfg = storageConfig.from?.[bucket] ?? {};
        return {
          upload: () => Promise.resolve(bucketCfg.upload ?? { data: { path: 'test.png' }, error: null }),
          remove: () => Promise.resolve(bucketCfg.remove ?? { data: null, error: null }),
          getPublicUrl: () => bucketCfg.getPublicUrl ?? { data: { publicUrl: 'https://example.com/test.png' } },
        };
      },
    },
  };
}
