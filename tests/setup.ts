import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { ref, computed } from 'vue';

beforeAll(() => {
  process.env.SUPABASE_URL = process.env.SUPABASE_URL
    ?? 'http://localhost:54321';
  process.env.SUPABASE_KEY = process.env.SUPABASE_KEY
    ?? 'test-publishable-key';
  process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
    ?? 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? 'test-service-role-key';
  process.env.NODE_ENV = 'test';

  const mockUser = ref({ id: 'user-1' });

  // Add Nuxt auto-imports to global scope
  (globalThis as any).useAuth = () => ({
    user: mockUser.value,
    signIn: vi.fn(() => Promise.resolve({ user: { id: 'user-1' } })),
    signOut: vi.fn(() => Promise.resolve({})),
    deleteAccount: vi.fn(() => Promise.resolve({})),
    updatePassword: vi.fn(() => Promise.resolve({ message: 'Password updated' })),
    addRole: vi.fn(() => Promise.resolve(['employer', 'worker']))
  });

  (globalThis as any).useSupabaseUser = () => mockUser;
  (globalThis as any).useSupabaseClient = () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { roles: ['employer'] }, error: null })
        })
      })
    })
  });

  (globalThis as any).useRouter = () => ({
    push: vi.fn()
  });

  (globalThis as any).useRoute = () => ({
    params: {},
    query: {}
  });

  (globalThis as any).useSlots = () => ({});

  (globalThis as any).useDirtyForm = () => ({
    isDirty: { value: false },
    resetDirty: vi.fn()
  });

  // Add Vue functions to global scope for auto-imports
  (globalThis as any).computed = computed;
});

afterEach(() => {
  // Ensure any spies/mocks created by individual tests don’t leak.
  vi.restoreAllMocks();
});

afterAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_KEY;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NODE_ENV;
});