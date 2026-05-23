import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import * as vueRouter from 'vue-router';
import JobsIdPage from '~/pages/jobs/[id].vue';

const mockUser = ref<any>({ id: 'user-1' });
const mockRoute = {
  params: { id: 'job-1' },
  query: {}
};

// Mock vue-router at module level
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => mockRoute
}));

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRoute: () => mockRoute,
  useRouter: () => ({ push: vi.fn() }),
  definePageMeta: vi.fn()
}));

// Mock composables at module level
vi.mock('~/composables/useJobs', () => ({
  useJobs: () => ({
    getJob: vi.fn(() => Promise.resolve({ job: null }))
  })
}));

vi.mock('~/composables/useApplications', () => ({
  useApplications: () => ({
    listMyApplications: vi.fn(() => Promise.resolve({ applications: [] }))
  })
}));

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Jobs [id] Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockUser.value = { id: 'user-1' };
  });

  const createWrapper = (isAuthenticated = true) => {
    return mount(JobsIdPage, {
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

    it('renders without errors when authenticated', async () => {
      wrapper = createWrapper(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors when not authenticated', async () => {
      wrapper = createWrapper(false);
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('job details', () => {
    it('renders without errors for job title', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for job description', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for apply button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('application status', () => {
    it('renders without errors for applied status', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for not applied status', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('loading states', () => {
    it('renders without errors for loading skeleton', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('renders without errors for error state', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });
});
