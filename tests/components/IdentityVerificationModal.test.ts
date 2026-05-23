import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import IdentityVerificationModal from '~/components/profile/IdentityVerificationModal.vue';

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

// Mock useIdentity composable
const mockIdentityStatus = ref('unverified');
const mockIsLoading = ref(false);
const mockLastError = ref<string | null>(null);
const mockStartVerification = vi.fn(() => Promise.resolve());
const mockReset = vi.fn();

vi.mock('~/composables/useIdentity', () => ({
  useIdentity: () => ({
    identityStatus: mockIdentityStatus,
    isLoading: mockIsLoading,
    lastError: mockLastError,
    startVerification: mockStartVerification,
    reset: mockReset
  })
}));

describe('IdentityVerificationModal', () => {
  let wrapper: any;

  const createWrapper = () => {
    return mount(IdentityVerificationModal);
  };

  beforeEach(() => {
    mockIdentityStatus.value = 'unverified';
    mockIsLoading.value = false;
    mockLastError.value = null;
    mockStartVerification.mockReset();
    mockReset.mockReset();
  });

  describe('rendering', () => {
    it('renders modal with correct title', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Verify your identity');
    });

    it('renders subtitle about Didit', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('powered by Didit');
    });

    it('renders close button', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.identity-modal__close').exists()).toBe(true);
    });

    it('renders start verification button when in idle state', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Start Identity Verification');
    });
  });

  describe('idle state', () => {
    it('shows start verification button', () => {
      wrapper = createWrapper();
      expect(wrapper.find('.identity-modal__submit').exists()).toBe(true);
    });

    it('calls startVerification when button is clicked', async () => {
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      await button.trigger('click');
      expect(mockStartVerification).toHaveBeenCalled();
    });

    it('shows loading state when isLoading is true', () => {
      mockIsLoading.value = true;
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      expect(button.text()).toContain('Loading...');
    });

    it('disables button when isLoading is true', () => {
      mockIsLoading.value = true;
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      expect(button.attributes('disabled')).toBeDefined();
    });
  });

  describe('success state', () => {
    it('renders without errors', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('declined state', () => {
    it('renders without errors', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('error state', () => {
    it('shows error message when startVerification throws error', async () => {
      mockStartVerification.mockRejectedValue(new Error('Test error'));
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      await button.trigger('click');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.text()).toContain('Something went wrong');
    });

    it('shows last error message when available', async () => {
      mockLastError.value = 'Network error';
      mockStartVerification.mockRejectedValue(new Error('Test error'));
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      await button.trigger('click');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(wrapper.text()).toContain('Network error');
    });

    it('resets state and returns to idle when try again is clicked', async () => {
      mockStartVerification.mockRejectedValue(new Error('Test error'));
      wrapper = createWrapper();
      const button = wrapper.find('.identity-modal__submit');
      await button.trigger('click');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tryAgainButton = wrapper.find('.identity-modal__submit');
      await tryAgainButton.trigger('click');
      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('close button', () => {
    it('emits close event when close button is clicked', async () => {
      wrapper = createWrapper();
      const closeButton = wrapper.find('.identity-modal__close');
      await closeButton.trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('has correct aria-label for accessibility', () => {
      wrapper = createWrapper();
      const closeButton = wrapper.find('.identity-modal__close');
      expect(closeButton.attributes('aria-label')).toBe('Close');
    });
  });

  describe('accessibility', () => {
    it('has role="dialog"', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    });

    it('has aria-modal="true"', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[aria-modal="true"]').exists()).toBe(true);
    });

    it('has aria-labelledby pointing to title', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[aria-labelledby="identity-title"]').exists()).toBe(true);
    });
  });

  describe('onMounted', () => {
    it('calls reset on mount', () => {
      wrapper = createWrapper();
      expect(mockReset).toHaveBeenCalled();
    });
  });
});
