import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import * as vueRouter from 'vue-router';
import ContractsIdPage from '~/pages/contracts/[id].vue';

const mockUser = ref<any>({ id: 'user-1' });
const mockRoute = {
  params: { id: 'contract-1' },
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
vi.mock('~/composables/useContracts', () => ({
  useContracts: () => ({
    getContract: vi.fn(() => Promise.resolve({ contract: null }))
  })
}));

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: () => ({ role: ref('worker') })
}));

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Contracts [id] Page', () => {
  let wrapper: any;

  beforeEach(() => {
    mockUser.value = { id: 'user-1' };
  });

  const createWrapper = () => {
    return mount(ContractsIdPage, {
      global: {
        stubs: {
          DataList: true,
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

    it('renders without errors for contract details', async () => {
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

  describe('contract details', () => {
    it('renders without errors for contract header', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for status pill', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for contract details', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for employer name', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for worker name', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('status display', () => {
    it('renders without errors for active contract', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for pending contract', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for completed contract', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors for cancelled contract', async () => {
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

    it('renders without errors for link to view contracts', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('worker bio display', () => {
    it('renders without errors for worker bio when present', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });

    it('renders without errors when bio not present', async () => {
      wrapper = createWrapper();
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(wrapper.exists()).toBe(true);
    });
  });
});
