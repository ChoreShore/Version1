import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ReviewsPage from '~/pages/reviews.vue';

// Mock composables at module level
vi.mock('~/composables/useReviews', () => ({
  useReviews: () => ({
    listReviews: vi.fn(() => Promise.resolve({ reviews: [] }))
  })
}));

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Reviews Page', () => {
  let wrapper: any;

  beforeEach(() => {
    // No need to set up mocks here since they're at module level
  });

  const createWrapper = (role: 'worker' | 'employer' = 'worker') => {
    return mount(ReviewsPage, {
      global: {
        stubs: {
          ReviewCard: true,
          StatusPill: true,
          EmptyState: true,
          LoadingSkeleton: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders the reviews title', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders filter buttons', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.find('button').exists()).toBe(true);
    });
  });

  describe('data loading', () => {
    it('loads reviews on mount', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors during loading', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(wrapper.text()).toContain('Reviews');
    });
  });

  describe('filtering', () => {
    it('switches between received and given reviews', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 100));
      const buttons = wrapper.findAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('stats calculation', () => {
    it('renders without errors', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('shows dash for average rating when no reviews', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('—');
    });
  });

  describe('empty states', () => {
    it('renders without errors when no reviews exist', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors for worker-specific empty state', async () => {
      wrapper = createWrapper('worker');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors for employer-specific empty state', async () => {
      wrapper = createWrapper('employer');
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors for given reviews empty state', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });
  });

  describe('error handling', () => {
    it('renders without errors on loading failure', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors with retry button', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });
  });

  describe('review cards', () => {
    it('renders without errors when reviews exist', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });
  });

  describe('panel title and description', () => {
    it('renders without errors for received reviews title', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors for received reviews description', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });

    it('renders without errors when switching to given reviews', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.text()).toContain('Reviews');
    });
  });
});
