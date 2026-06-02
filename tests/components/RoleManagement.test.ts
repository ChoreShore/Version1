import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import RoleManagement from '~/components/profile/RoleManagement.vue';

const mockAddRole = vi.fn(() => Promise.resolve({ roles: ['employer', 'worker'] }));
const mockUser = ref<any>({ id: 'user-1' });
const mockRoles = ref<string[]>(['employer']);

describe('RoleManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = { id: 'user-1' };
    mockRoles.value = ['employer'];
    mockAddRole.mockResolvedValue({ roles: ['employer', 'worker'] });

    (globalThis as any).useAuth = () => ({ addRole: mockAddRole });
    (globalThis as any).useSupabaseUser = () => mockUser;
    (globalThis as any).useSupabaseClient = () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: { roles: mockRoles.value }, error: null })
          })
        })
      })
    });
  });

  const createWrapper = () => mount(RoleManagement);

  it('displays current roles as badges', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.role-badge--employer').exists()).toBe(true);
  });

  it('shows "Add Worker role" button when worker role is missing', async () => {
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.role-button--worker').exists()).toBe(true);
    expect(wrapper.text()).toContain('Add Worker role');
  });

  it('hides add button and shows all-roles message when worker role exists', async () => {
    mockRoles.value = ['employer', 'worker'];
    const wrapper = createWrapper();
    await flushPromises();
    expect(wrapper.find('.role-button--worker').exists()).toBe(false);
    expect(wrapper.text()).toContain('You have all available roles');
  });

  it('calls addRole API and shows success on button click', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('.role-button--worker').trigger('click');
    await flushPromises();

    expect(mockAddRole).toHaveBeenCalledWith('worker');
    expect(wrapper.find('.role-management__success').exists()).toBe(true);
    expect(wrapper.text()).toContain('Worker role added successfully');
  });

  it('shows error message when addRole fails', async () => {
    mockAddRole.mockRejectedValueOnce({ data: { statusMessage: 'Role limit reached' } });
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('.role-button--worker').trigger('click');
    await flushPromises();

    expect(wrapper.find('.role-management__error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Role limit reached');
  });

  it('disables button while loading', async () => {
    mockAddRole.mockReturnValue(new Promise(() => {}));
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.find('.role-button--worker').trigger('click');
    await nextTick();

    const button = wrapper.find('.role-button--worker');
    expect(button.attributes('disabled')).toBeDefined();
    expect(button.text()).toContain('Adding...');
  });
});
