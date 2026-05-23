import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import UpdatePasswordForm from '~/components/profile/UpdatePasswordForm.vue';

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

describe('UpdatePasswordForm', () => {
  let wrapper: any;

  const createWrapper = () => {
    return mount(UpdatePasswordForm, {
      global: {
        stubs: {
          FormErrorBoundary: true,
          ConfirmDialog: true
        }
      }
    });
  };

  describe('rendering', () => {
    it('renders without errors', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });
});
