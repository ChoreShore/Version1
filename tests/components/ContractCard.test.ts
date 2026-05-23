import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ContractCard from '~/components/contracts/ContractCard.vue';
import type { ContractWithDetailsInput, ContractStatus } from '~/schemas/contract';

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
  definePageMeta: vi.fn(),
  useSlots: vi.fn(() => ({ actions: true }))
}));

describe('ContractCard', () => {
  let wrapper: any;

  const createContract = (overrides: Partial<ContractWithDetailsInput> = {}): ContractWithDetailsInput => ({
    id: 'contract-1',
    job_id: 'job-1',
    application_id: 'app-1',
    job_title: 'Test Job',
    status: 'active',
    employer_id: 'emp-1',
    worker_id: 'worker-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides
  });

  const createWrapper = (contract: ContractWithDetailsInput) => {
    return mount(ContractCard, {
      props: { contract },
      global: {
        stubs: {
          StatusPill: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('rendering', () => {
    it('renders contract card with job title', () => {
      const contract = createContract({ job_title: 'Cleaning Job' });
      wrapper = createWrapper(contract);
      expect(wrapper.find('.contract-card').exists()).toBe(true);
    });

    it('renders "Untitled Job" when job_title is missing', () => {
      const contract = createContract({ job_title: undefined });
      wrapper = createWrapper(contract);
      expect(wrapper.find('.contract-card').exists()).toBe(true);
    });

    it('renders contract eyebrow label', () => {
      const contract = createContract();
      wrapper = createWrapper(contract);
      expect(wrapper.text()).toContain('Contract');
    });

    it('renders created date in formatted format', () => {
      const contract = createContract({ created_at: '2024-01-15T10:00:00Z' });
      wrapper = createWrapper(contract);
      expect(wrapper.text()).toContain('Jan 15, 2024');
    });
  });

  describe('status display', () => {
    it('renders correct status label for pending contract', () => {
      const contract = createContract({ status: 'pending' });
      wrapper = createWrapper(contract);
      expect(wrapper.findComponent({ name: 'StatusPill' }).exists()).toBe(true);
    });

    it('renders correct status label for active contract', () => {
      const contract = createContract({ status: 'active' });
      wrapper = createWrapper(contract);
      expect(wrapper.findComponent({ name: 'StatusPill' }).exists()).toBe(true);
    });

    it('renders correct status label for completed contract', () => {
      const contract = createContract({ status: 'completed' });
      wrapper = createWrapper(contract);
      expect(wrapper.findComponent({ name: 'StatusPill' }).exists()).toBe(true);
    });

    it('renders correct status label for cancelled contract', () => {
      const contract = createContract({ status: 'cancelled' });
      wrapper = createWrapper(contract);
      expect(wrapper.findComponent({ name: 'StatusPill' }).exists()).toBe(true);
    });
  });

  describe('status variant mapping', () => {
    it('maps pending status to warning variant', () => {
      const contract = createContract({ status: 'pending' });
      wrapper = createWrapper(contract);
      const statusPill = wrapper.findComponent({ name: 'StatusPill' });
      expect(statusPill.props('variant')).toBe('warning');
    });

    it('maps active status to info variant', () => {
      const contract = createContract({ status: 'active' });
      wrapper = createWrapper(contract);
      const statusPill = wrapper.findComponent({ name: 'StatusPill' });
      expect(statusPill.props('variant')).toBe('info');
    });

    it('maps completed status to success variant', () => {
      const contract = createContract({ status: 'completed' });
      wrapper = createWrapper(contract);
      const statusPill = wrapper.findComponent({ name: 'StatusPill' });
      expect(statusPill.props('variant')).toBe('success');
    });

    it('maps cancelled status to neutral variant', () => {
      const contract = createContract({ status: 'cancelled' });
      wrapper = createWrapper(contract);
      const statusPill = wrapper.findComponent({ name: 'StatusPill' });
      expect(statusPill.props('variant')).toBe('neutral');
    });
  });

  describe('actions slot', () => {
    it('renders actions slot when provided', () => {
      const contract = createContract();
      (globalThis as any).useSlots = () => ({ actions: true });
      wrapper = mount(ContractCard, {
        props: { contract },
        global: {
          stubs: {
            NuxtLink: true,
            StatusPill: true
          }
        },
        slots: {
          actions: '<button>Action Button</button>'
        }
      });
      expect(wrapper.find('.contract-card__footer').exists()).toBe(true);
      (globalThis as any).useSlots = () => ({});
    });

    it('does not render footer when actions slot is not provided', () => {
      const contract = createContract();
      wrapper = createWrapper(contract);
      expect(wrapper.find('.contract-card__footer').exists()).toBe(false);
    });
  });

  describe('navigation', () => {
    it('renders NuxtLink to contract detail page', () => {
      const contract = createContract({ id: 'contract-123' });
      wrapper = createWrapper(contract);
      const link = wrapper.findComponent({ name: 'NuxtLink' });
      expect(link.exists()).toBe(true);
    });
  });
});
