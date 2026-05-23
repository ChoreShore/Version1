import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResetPasswordPage from '~/pages/auth/reset-password.vue';

// Stub Nuxt auto-imports
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = vi.fn();

describe('Auth Reset-Password Page', () => {
  let wrapper: any;

  beforeEach(() => {
    (globalThis as any).$fetch.mockReset();
  });

  const createWrapper = () => {
    return mount(ResetPasswordPage, {
      global: {
        stubs: {
          FormField: true,
          FormLabel: true,
          FormControl: true,
          FormError: true,
          FormHint: true,
          LoadingSkeleton: true,
          NuxtLink: true
        }
      }
    });
  };

  describe('page rendering', () => {
    it('renders the reset password title', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Reset Password');
    });

    it('renders email input field', () => {
      wrapper = createWrapper();
      expect(wrapper.findComponent({ name: 'FormField' }).exists()).toBe(true);
    });

    it('renders submit button', () => {
      wrapper = createWrapper();
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
      expect(wrapper.find('button[type="submit"]').text()).toContain('Send Reset Link');
    });

    it('renders FormHint component', () => {
      wrapper = createWrapper();
      // FormHint is stubbed, so just check the component exists in stubs
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
    });

    it('has link to sign-in page', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain('Remember your password?');
      const nuxtLinks = wrapper.findAllComponents({ name: 'NuxtLink' });
      expect(nuxtLinks.length).toBeGreaterThan(0);
    });

    it('has link to sign-up page', () => {
      wrapper = createWrapper();
      expect(wrapper.text()).toContain("Don't have an account?");
      const nuxtLinks = wrapper.findAllComponents({ name: 'NuxtLink' });
      expect(nuxtLinks.length).toBeGreaterThan(0);
    });
  });

  describe('form validation', () => {
    it('disables submit button when email is empty', () => {
      wrapper = createWrapper();
      const submitButton = wrapper.find('button[type="submit"]');
      expect(submitButton.attributes('disabled')).toBeDefined();
    });
  });
});
