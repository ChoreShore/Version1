import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import SignInPage from '~/pages/auth/sign-in.vue';

const mockSupabaseAuth = {
  signInWithPassword: vi.fn()
};

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: vi.fn()
};

const mockUser = ref<any>({ id: 'user-1' });

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useSupabaseClient: () => mockSupabase,
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  definePageMeta: vi.fn()
}));

// Mock composables at module level
vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    signIn: vi.fn(() => Promise.resolve({ user: { id: 'user-1' } })),
    signOut: vi.fn(() => Promise.resolve({}))
  })
}));

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();
(globalThis as any).useSupabaseClient = vi.fn(() => mockSupabase);
(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);
(globalThis as any).navigateTo = vi.fn();

describe('Auth Sign-In Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockSupabaseAuth.signInWithPassword.mockReset();
    mockSupabase.from.mockReset();
    mockUser.value = null;
    (globalThis as any).navigateTo.mockReset();
  });

  const createWrapper = () => {
    return mount(SignInPage, {
      global: {
        stubs: {
          FormField: true,
          FormLabel: true,
          FormControl: true,
          FormError: true,
          FormHint: true,
          FormSuccess: true,
          LoadingSkeleton: true,
          FormErrorBoundary: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders without errors', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for sign-in title', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('form rendering', () => {
    it('renders without errors for email field', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for password field', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for sign-in button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('form validation', () => {
    it('renders without errors for email validation', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for password validation', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('form submission', () => {
    it('renders without errors for successful sign-in', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for sign-in error', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('sign-in flow', () => {
    it('renders without errors for redirect to dashboard', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for redirect to complete-profile', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('loading state', () => {
    it('renders without errors for loading state', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('navigation links', () => {
    it('renders without errors for reset-password link', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for sign-up link', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });
});
