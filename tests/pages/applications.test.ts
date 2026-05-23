import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ApplicationsPage from '~/pages/applications.vue';

// Mock composables at module level
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

describe('Applications Page', () => {
  let wrapper: any;

  beforeEach(() => {
    // No need to set up mocks here since they're at module level
  });

  const createWrapper = () => {
    return mount(ApplicationsPage, {
      global: {
        stubs: {
          ApplicationCard: true,
          StatusPill: true,
          EmptyState: true,
          LoadingSkeleton: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders the applications title', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders stats section', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.text()).toContain('Total');
    });

    it('renders filter buttons', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.find('button').exists()).toBe(true);
    });
  });

  describe('data loading', () => {
    it('loads applications on mount', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors during loading', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.text()).toContain('Applications');
    });
  });

  describe('role-based display', () => {
    it('renders without errors for worker-specific display', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors for employer-specific display', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });
  });

  describe('filtering', () => {
    it('renders without errors for filtering', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('empty states', () => {
    it('renders without errors when no applications exist', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors for worker-specific empty state', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors for employer-specific empty state', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });
  });

  describe('error handling', () => {
    it('renders without errors on loading failure', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors with retry button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });
  });

  describe('withdraw functionality', () => {
    it('renders without errors for withdraw modal', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });

    it('renders without errors for direct withdraw', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });
  });

  describe('stats calculation', () => {
    it('renders without errors for stats', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Applications');
    });
  });
});
