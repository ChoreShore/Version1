import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import DeleteAccountForm from '~/components/profile/DeleteAccountForm.vue';

const mockDeleteAccount = vi.fn(() => Promise.resolve({ success: true }));
const mockPush = vi.fn();
const mockUser = ref<any>({ id: 'user-1' });

describe('DeleteAccountForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteAccount.mockResolvedValue({ success: true });
    mockPush.mockReset();

    (globalThis as any).useAuth = () => ({ deleteAccount: mockDeleteAccount });
    (globalThis as any).useRouter = () => ({ push: mockPush });
    (globalThis as any).useSupabaseUser = () => mockUser;
    (globalThis as any).useRoute = () => ({ params: {}, query: {} });
    (globalThis as any).definePageMeta = vi.fn();
  });

  const createWrapper = () => {
    return mount(DeleteAccountForm, {
      global: { stubs: { FormErrorBoundary: { template: '<slot />' } } }
    });
  };

  it('renders confirmation and password fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('disables submit when confirmation is not DELETE', async () => {
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('delete');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await nextTick();

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
  });

  it('enables submit when form is valid', async () => {
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('DELETE');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await nextTick();

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();
  });

  it('shows field error for invalid confirmation', async () => {
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('wrong');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await nextTick();

    expect(wrapper.find('.delete-form__field-error').exists()).toBe(true);
    expect(wrapper.text()).toContain('type DELETE');
  });

  it('calls deleteAccount with validated payload on submit', async () => {
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('DELETE');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(mockDeleteAccount).toHaveBeenCalledWith({
      confirmation: 'DELETE',
      password: 'MyPassword1'
    });
  });

  it('redirects to home on successful deletion', async () => {
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('DELETE');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays API error when deletion fails', async () => {
    mockDeleteAccount.mockRejectedValue({ data: { statusMessage: 'Wrong password' } });
    const wrapper = createWrapper();
    await wrapper.find('input[type="text"]').setValue('DELETE');
    await wrapper.find('input[type="password"]').setValue('MyPassword1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.delete-form__error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Wrong password');
  });
});
