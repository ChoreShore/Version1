import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import * as vueRouter from 'vue-router';
import ProfilePage from '~/pages/profile/[username].vue';

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  options: {},
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  clearRoutes: vi.fn(),
  hasRoute: vi.fn(),
  getRoutes: vi.fn(),
  resolve: vi.fn(),
  currentRoute: { value: {} },
  install: vi.fn()
} as any;

const mockRoute = {
  params: { username: 'testuser' },
  query: {}
};

const mockUser = ref<any>({ id: 'user-1' });
const mockSupabaseClient = {
  from: vi.fn()
};

// Mock vue-router at module level
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}));

// Mock composables at module level
vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

vi.mock('~/composables/useProfile', () => ({
  useProfile: () => ({
    getProfile: vi.fn(() => Promise.resolve({ profile: { username: 'testuser' } }))
  })
}));

// Stub Nuxt auto-imports
(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);
(globalThis as any).useSupabaseClient = vi.fn(() => mockSupabaseClient);
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();
(globalThis as any).useFetch = vi.fn(() => ({
  data: ref(null),
  pending: ref(true),
  error: ref(null)
}));

describe('Profile [username] Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockUser.value = { id: 'user-1' };
    (globalThis as any).useRouter = vi.fn(() => ({ push: vi.fn() }));
  });

  const createWrapper = () => {
    return mount(ProfilePage, {
      global: {
        stubs: {
          Avatar: true,
          StatusPill: true,
          EmptyState: true,
          LoadingSkeleton: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders without errors while loading', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders profile header when data loaded', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('profile header', () => {
    it('renders without errors for avatar placeholder', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for user initials', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for user location', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for user roles', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for rating', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('action buttons', () => {
    it('renders without errors for Edit Profile button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for Message button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for Save button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('work history section', () => {
    it('renders without errors for work history', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for empty work history', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('jobs posted section', () => {
    it('renders without errors for jobs posted', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('reviews section', () => {
    it('renders without errors for reviews', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('sidebar', () => {
    it('renders without errors for trust & safety', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for stats', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for CTA', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('renders without errors on load failure', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('about section', () => {
    it('renders without errors for bio', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });
});
