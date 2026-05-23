import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import DeleteAccountForm from '~/components/profile/DeleteAccountForm.vue';

const mockUser = ref<any>({ id: 'user-1' });
const mockRoute = {
  params: {},
  query: {}
};
const mockRouter = {
  push: vi.fn()
};

// Mock #imports module at module level
vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
  definePageMeta: vi.fn()
}));

describe('DeleteAccountForm', () => {
  let wrapper: any;

  const createWrapper = () => {
    return mount(DeleteAccountForm, {
      global: {
        stubs: {
          FormErrorBoundary: true
        }
      }
    });
  };

  beforeEach(() => {
    mockRouter.push.mockReset();
  });

  describe('rendering', () => {
    it('renders without errors', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });
});
