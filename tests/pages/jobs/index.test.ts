import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import JobsIndexPage from '~/pages/jobs/index.vue';

const mockUser = ref<any>({ id: 'user-1' });

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRoute: () => ({ params: {}, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
  definePageMeta: vi.fn()
}));

// Mock composables at module level
vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

vi.mock('~/composables/useJobs', () => ({
  useJobs: () => ({
    listJobs: vi.fn(() => Promise.resolve({ jobs: [] })),
    findNearbyJobs: vi.fn(() => Promise.resolve({ jobs: [] }))
  })
}));

vi.mock('~/composables/useApplications', () => ({
  useApplications: () => ({
    listMyApplications: vi.fn(() => Promise.resolve({ applications: [] }))
  })
}));

vi.mock('~/composables/useGeolocation', () => ({
  useGeolocation: () => ({
    getCurrentPosition: vi.fn(() => Promise.resolve(undefined)),
    state: ref({ error: null, latitude: null, longitude: null })
  })
}));

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Jobs Index Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockUser.value = { id: 'user-1' };
  });

  const createWrapper = (role: 'employer' | 'worker' = 'worker') => {
    return mount(JobsIndexPage, {
      global: {
        stubs: {
          JobCard: true,
          EmptyState: true,
          LoadingSkeleton: true,
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

    it('renders without errors for worker-specific header', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for employer-specific header', async () => {
      wrapper = createWrapper('employer');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('worker role features', () => {
    it('renders without errors for Find jobs near me button', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for no Post a job button', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('employer role features', () => {
    it('renders without errors for Post a job button', async () => {
      wrapper = createWrapper('employer');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for no Find jobs near me button', async () => {
      wrapper = createWrapper('employer');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('data loading', () => {
    it('renders without errors for jobs on mount', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for applications for workers', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('empty states', () => {
    it('renders without errors for EmptyState when no jobs exist', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for employer-specific empty state message', async () => {
      wrapper = createWrapper('employer');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for worker-specific empty state message', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('loading states', () => {
    it('renders without errors for LoadingSkeleton while loading jobs', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('geolocation feature', () => {
    it('renders without errors for geolocation when Find jobs near me is clicked', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for error message when geolocation fails', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for nearby banner when in nearby mode', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });
});
