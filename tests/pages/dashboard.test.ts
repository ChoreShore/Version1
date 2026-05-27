import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick, computed } from 'vue';
import DashboardPage from '~/pages/dashboard.vue';
import { useActiveRole } from '~/composables/useActiveRole';

vi.mock('~/composables/useActiveRole');

const mockRole = ref('employer');
const mockUser = ref<any>({ id: 'user-1' });

(globalThis as any).useSupabaseUser = vi.fn(() => mockUser);
(globalThis as any).useSupabaseClient = vi.fn(() => ({}));
(globalThis as any).definePageMeta = vi.fn();

describe('Dashboard Page', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRole.value = 'employer';
    mockUser.value = { id: 'user-1' };

    vi.mocked(useActiveRole).mockReturnValue({
      role: mockRole,
      setRole: vi.fn(),
      isEmployer: computed(() => mockRole.value === 'employer'),
      isWorker: computed(() => mockRole.value === 'worker')
    } as any);

    mockFetch = vi.fn((url: string) => {
      if (url.startsWith('/api/jobs')) return Promise.resolve({ jobs: [] as any[] });
      if (url.startsWith('/api/applications')) return Promise.resolve({ applications: [] as any[] });
      if (url.startsWith('/api/payments')) return Promise.resolve({ events: [] as any[] });
      return Promise.resolve({});
    });
    (globalThis as any).$fetch = mockFetch;
  });

  const createWrapper = () => {
    return mount(DashboardPage, {
      global: {
        stubs: {
          OverviewStats: true,
          JobCard: true,
          ApplicationCard: true,
          StatusPill: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('rendering', () => {
    it('renders OverviewStats and three DataList sections', async () => {
      const wrapper = createWrapper();
      await flushPromises();
      expect(wrapper.findComponent({ name: 'OverviewStats' }).exists()).toBe(true);
      expect(wrapper.findAllComponents({ name: 'DataList' }).length).toBe(3);
    });
  });

  describe('employer role', () => {
    it('passes employer stats to OverviewStats', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.startsWith('/api/jobs')) return Promise.resolve({ jobs: [{ id: '1', status: 'open' }, { id: '2', status: 'closed' }] });
        if (url.startsWith('/api/applications')) return Promise.resolve({ applications: [{ id: 'a1', status: 'pending' }, { id: 'a2', status: 'accepted' }] });
        if (url.startsWith('/api/payments')) return Promise.resolve({ events: [{ id: 'e1', status: 'pending' }] });
        return Promise.resolve({});
      });

      const wrapper = createWrapper();
      await flushPromises();

      const overviewStats = wrapper.findComponent({ name: 'OverviewStats' });
      const statsProp = overviewStats.props('stats');
      expect(statsProp).toEqual(expect.arrayContaining([
        expect.objectContaining({ title: 'Open jobs', value: '1' }),
        expect.objectContaining({ title: 'Applications', value: '2' }),
        expect.objectContaining({ title: 'Pending decisions', value: '1' }),
        expect.objectContaining({ title: 'Pending payments', value: '1' })
      ]));
    });

    it('shows employer empty state text when no jobs exist', async () => {
      const wrapper = createWrapper();
      await flushPromises();

      const emptyStates = wrapper.findAllComponents({ name: 'EmptyState' });
      expect(emptyStates.length).toBeGreaterThan(0);
      expect(emptyStates[0].props('title')).toBe('No jobs posted yet');
      expect(emptyStates[0].props('description')).toContain('Jobs you create');
    });
  });

  describe('worker role', () => {
    beforeEach(() => {
      mockRole.value = 'worker';
    });

    it('passes worker stats to OverviewStats', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.startsWith('/api/applications')) {
          return Promise.resolve({ applications: [{ id: 'a1', status: 'pending' }, { id: 'a2', status: 'accepted' }, { id: 'a3', status: 'accepted' }] });
        }
        return Promise.resolve({ jobs: [], events: [] });
      });

      const wrapper = createWrapper();
      await flushPromises();

      const overviewStats = wrapper.findComponent({ name: 'OverviewStats' });
      const statsProp = overviewStats.props('stats');
      expect(statsProp).toEqual(expect.arrayContaining([
        expect.objectContaining({ title: 'Applications sent', value: '3' }),
        expect.objectContaining({ title: 'Pending', value: '1' }),
        expect.objectContaining({ title: 'Accepted', value: '2' })
      ]));
    });

    it('shows worker empty state text when no jobs exist', async () => {
      const wrapper = createWrapper();
      await flushPromises();

      const emptyStates = wrapper.findAllComponents({ name: 'EmptyState' });
      expect(emptyStates.length).toBeGreaterThan(0);
      expect(emptyStates[0].props('title')).toBe('No jobs available');
      expect(emptyStates[0].props('description')).toContain('available jobs');
    });
  });

  describe('loading states', () => {
    it('shows LoadingSkeleton while data is loading', async () => {
      mockFetch.mockReturnValue(new Promise(() => {}));

      const wrapper = createWrapper();
      await nextTick();

      const skeletons = wrapper.findAllComponents({ name: 'LoadingSkeleton' });
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('data rendering', () => {
    it('renders JobCard components when jobs exist', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.startsWith('/api/jobs')) return Promise.resolve({ jobs: [{ id: 'job-1', title: 'Test Job' }] });
        return Promise.resolve({ applications: [], events: [] });
      });

      const wrapper = createWrapper();
      await flushPromises();

      const jobCards = wrapper.findAllComponents({ name: 'JobCard' });
      expect(jobCards.length).toBe(1);
    });

    it('renders ApplicationCard components when applications exist', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.startsWith('/api/applications')) return Promise.resolve({ applications: [{ id: 'app-1', status: 'pending' }] });
        return Promise.resolve({ jobs: [], events: [] });
      });

      const wrapper = createWrapper();
      await flushPromises();

      const appCards = wrapper.findAllComponents({ name: 'ApplicationCard' });
      expect(appCards.length).toBe(1);
      expect(appCards[0].props('perspective')).toBe('employer');
    });
  });

  describe('error handling', () => {
    it('renders without crashing when payments fail to load', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.startsWith('/api/payments')) return Promise.reject(new Error('Network error'));
        return Promise.resolve({ jobs: [], applications: [] });
      });

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.findComponent({ name: 'OverviewStats' }).exists()).toBe(true);
    });
  });
});
