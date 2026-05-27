import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import JobCard from '~/components/jobs/JobCard.vue';
import type { JobWithDetailsInput } from '~/schemas/job';

const mockUser = ref<any>({ id: 'user-1' });
const mockRoute = {
  params: {},
  query: {}
};

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRoute: () => mockRoute,
  useRouter: () => ({ push: vi.fn() }),
  definePageMeta: vi.fn()
}));

describe('JobCard', () => {
  let wrapper: any;

  const createJob = (overrides: Partial<JobWithDetailsInput & { application_count?: number; has_applied?: boolean; distance_km?: number }> = {}): JobWithDetailsInput & { application_count?: number; has_applied?: boolean; distance_km?: number } => ({
    id: 'job-1',
    title: 'Test Job',
    description: 'This is a test job description that is long enough to be truncated',
    category_id: 'cat-1',
    category_name: 'Cleaning',
    employer_id: 'emp-1',
    status: 'open',
    budget_type: 'fixed',
    budget_amount: 100,
    postcode: 'SW1A 1AA',
    deadline: '2024-12-31',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides
  });

  const createWrapper = (job: JobWithDetailsInput & { application_count?: number; has_applied?: boolean; distance_km?: number }) => {
    return mount(JobCard, {
      props: { job },
      global: {
        stubs: {
          StatusPill: true,
          InfoBadge: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('rendering', () => {
    it('renders job card with title', () => {
      const job = createJob({ title: 'Cleaning Job' });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('Cleaning');
    });

    it('renders category name', () => {
      const job = createJob({ category_name: 'Plumbing' });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('Plumbing');
    });

    it('renders "General" when category_name is missing', () => {
      const job = createJob({ category_name: undefined });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('General');
    });

    it('renders description', () => {
      const job = createJob({ description: 'Test description' });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('Test description');
    });

    it('renders budget display for fixed budget', () => {
      const job = createJob({ budget_type: 'fixed', budget_amount: 150 });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('£150');
    });

    it('renders budget display for hourly budget', () => {
      const job = createJob({ budget_type: 'hourly', budget_amount: 25 });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('£25/hr');
    });

    it('renders deadline', () => {
      const job = createJob({ deadline: '2024-12-31' });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('Dec 31, 2024');
    });

    it('renders postcode', () => {
      const job = createJob({ postcode: 'SW1A 1AA' });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('SW1A 1AA');
    });
  });

  describe('status pills', () => {
    it('renders urgent pill when job is urgent', () => {
      const job = createJob({ is_urgent: true });
      wrapper = createWrapper(job);
      const urgentPill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === 'Urgent');
      expect(urgentPill).toBeDefined();
    });

    it('renders recurring pill when job is recurring', () => {
      const job = createJob({ is_recurring: true });
      wrapper = createWrapper(job);
      const recurringPill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === 'Recurring');
      expect(recurringPill).toBeDefined();
    });

    it('renders applied pill when user has applied', () => {
      const job = createJob({ has_applied: true });
      wrapper = createWrapper(job);
      const appliedPill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === 'Applied');
      expect(appliedPill).toBeDefined();
    });

    it('renders distance pill when distance is available', () => {
      const job = createJob({ distance_km: 5.5 });
      wrapper = createWrapper(job);
      const distancePill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === '5.5 km');
      expect(distancePill).toBeDefined();
    });

    it('renders status pill with correct variant for open status', () => {
      const job = createJob({ status: 'open' });
      wrapper = createWrapper(job);
      const statusPill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === 'open');
      expect(statusPill?.props('variant')).toBe('info');
    });

    it('renders status pill with correct variant for closed status', () => {
      const job = createJob({ status: 'closed' });
      wrapper = createWrapper(job);
      const statusPill = wrapper.findAllComponents({ name: 'StatusPill' }).find((pill: any) => pill.props('label') === 'closed');
      expect(statusPill?.props('variant')).toBe('warning');
    });
  });

  describe('description expansion', () => {
    it('shows expand button when description is longer than 180 characters', () => {
      const longDescription = 'a'.repeat(200);
      const job = createJob({ description: longDescription });
      wrapper = createWrapper(job);
      expect(wrapper.text()).toContain('Show more');
    });

    it('does not show expand button when description is shorter than 180 characters', () => {
      const shortDescription = 'a'.repeat(100);
      const job = createJob({ description: shortDescription });
      wrapper = createWrapper(job);
      expect(wrapper.text()).not.toContain('Show more');
    });

    it('toggles description expansion on button click', async () => {
      const longDescription = 'a'.repeat(200);
      const job = createJob({ description: longDescription });
      wrapper = createWrapper(job);

      const expandButton = wrapper.find('.job-card__expand');
      await expandButton.trigger('click');

      expect(wrapper.text()).toContain('Show less');
    });
  });

  describe('application count', () => {
    it('renders application count badge', () => {
      const job = createJob({ application_count: 5 });
      wrapper = createWrapper(job);
      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' });
      expect(infoBadge.props('label')).toBe('5 applications');
    });

    it('renders 0 applications when count is not provided', () => {
      const job = createJob({ application_count: undefined });
      wrapper = createWrapper(job);
      const infoBadge = wrapper.findComponent({ name: 'InfoBadge' });
      expect(infoBadge.props('label')).toBe('0 applications');
    });
  });

  describe('navigation', () => {
    it('renders NuxtLink to job detail page', () => {
      const job = createJob({ id: 'job-123' });
      wrapper = createWrapper(job);
      const link = wrapper.findComponent({ name: 'NuxtLink' });
      expect(link.exists()).toBe(true);
    });
  });

  describe('actions slot', () => {
    it('renders actions slot when provided', () => {
      const job = createJob();
      wrapper = mount(JobCard, {
        props: { job },
        slots: {
          actions: '<button>Action Button</button>'
        },
        global: {
          stubs: {
            StatusPill: true,
            InfoBadge: true,
            NuxtLink: true
          }
        }
      });
      expect(wrapper.text()).toContain('Action Button');
    });
  });

  describe('clickable behavior', () => {
    it('is clickable by default', () => {
      const job = createJob();
      wrapper = createWrapper(job);
      expect(wrapper.props('clickable')).toBe(true);
    });

    it('can be made non-clickable', () => {
      const job = createJob();
      wrapper = mount(JobCard, {
        props: { job, clickable: false },
        global: {
          stubs: {
            StatusPill: true,
            InfoBadge: true,
            NuxtLink: true
          }
        }
      });
      expect(wrapper.props('clickable')).toBe(false);
    });
  });
});
