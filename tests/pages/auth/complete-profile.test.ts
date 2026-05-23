import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import CompleteProfilePage from '~/pages/auth/complete-profile.vue';

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

const mockSupabaseClient = {
  from: vi.fn()
};

const mockUser = ref<any>({ id: 'user-1' });

// Mock vue-router at module level
vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}));

// Mock composables at module level
vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

// Stub Nuxt auto-imports
(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);
(globalThis as any).useSupabaseClient = vi.fn(() => mockSupabaseClient);
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Auth Complete-Profile Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockRouter.push.mockReset();
    mockSupabaseClient.from.mockReset();
  });

  const createWrapper = () => {
    return mount(CompleteProfilePage, {
      global: {
        stubs: {
          PhotoUpload: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders the complete profile title', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Complete your profile');
    });

    it('renders the PhotoUpload component', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent({ name: 'PhotoUpload' }).exists()).toBe(true);
    });

    it('shows subtitle about uploading photo', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Upload a photo to finish setting up your account');
    });

    it('shows note about photo visibility', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('This photo will be visible to other users');
    });
  });

  describe('authentication check', () => {
    it('renders without errors when user is not authenticated', async () => {
      mockUser.value = null;
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });

    it('renders without errors when user is authenticated', async () => {
      mockUser.value = { id: 'user-1' };
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });
  });

  describe('profile loading', () => {
    it('renders without errors when fetching user profile', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { photo_url: null }, error: null })
          })
        })
      });
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });

    it('renders without errors when user already has photo', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { photo_url: 'http://example.com/photo.jpg' }, error: null })
          })
        })
      });
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });

    it('renders without errors when profile fetch fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Failed to fetch') })
          })
        })
      });
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });
  });

  describe('photo upload', () => {
    it('renders without errors when photo upload succeeds', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Complete your profile');
    });
  });
});
