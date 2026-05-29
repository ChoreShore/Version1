import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick, computed } from 'vue';
import RtwSettingsSection from '~/components/profile/RtwSettingsSection.vue';

const mockRtwStatus = ref('unverified');
const mockRtwExpiryDate = ref<string | null>(null);
const mockRtwLoading = ref(false);
const mockFetchRtwStatus = vi.fn();

vi.mock('~/composables/useActiveRole', () => ({
  useActiveRole: vi.fn(() => ({ isWorker: { value: true } }))
}));

vi.mock('~/composables/useRtw', () => ({
  useRtw: vi.fn(() => ({
    rtwStatus: mockRtwStatus,
    rtwExpiryDate: mockRtwExpiryDate,
    rtwLoading: mockRtwLoading,
    isExpired: computed(() => {
      if (!mockRtwExpiryDate.value) return false;
      return new Date(mockRtwExpiryDate.value) < new Date();
    }),
    fetchRtwStatus: mockFetchRtwStatus,
    resetRtwCache: vi.fn()
  }))
}));

describe('RtwSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRtwStatus.value = 'unverified';
    mockRtwExpiryDate.value = null;
    mockRtwLoading.value = false;
  });

  const createWrapper = () =>
    mount(RtwSettingsSection, {
      global: { stubs: { RtwVerificationModal: true } }
    });

  it('shows loading state', () => {
    mockRtwLoading.value = true;
    const wrapper = createWrapper();
    expect(wrapper.find('.rtw-settings__loading').exists()).toBe(true);
    expect(wrapper.find('.rtw-settings__loading').text()).toBe('Loading status...');
  });

  it('shows verified state with expiry date', () => {
    mockRtwStatus.value = 'verified';
    mockRtwExpiryDate.value = '2028-12-31';
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    expect(wrapper.find('.rtw-settings__badge--verified').exists()).toBe(true);
    expect(wrapper.find('.rtw-settings__badge--verified').text()).toBe('Verified');
    expect(wrapper.find('.rtw-settings__expiry').text()).toContain('Valid until');
  });

  it('shows expired state with re-verify button', () => {
    mockRtwStatus.value = 'verified';
    mockRtwExpiryDate.value = '2020-01-01';
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    expect(wrapper.find('.rtw-settings__badge--expired').exists()).toBe(true);
    expect(wrapper.find('.settings-action-button').text()).toBe('Re-verify right to work');
  });

  it('shows unverified state with verify button', () => {
    mockRtwStatus.value = 'unverified';
    mockRtwExpiryDate.value = null;
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    expect(wrapper.find('.rtw-settings__badge--unverified').exists()).toBe(true);
    expect(wrapper.find('.settings-action-button').text()).toBe('Verify your right to work');
  });

  it('opens modal when verify button clicked', async () => {
    mockRtwStatus.value = 'unverified';
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    expect(wrapper.findComponent({ name: 'RtwVerificationModal' }).exists()).toBe(false);

    await wrapper.find('.settings-action-button').trigger('click');
    await nextTick();

    expect(wrapper.findComponent({ name: 'RtwVerificationModal' }).exists()).toBe(true);
  });

  it('calls fetchRtwStatus on verified emit', async () => {
    mockRtwStatus.value = 'unverified';
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    await wrapper.find('.settings-action-button').trigger('click');
    await nextTick();

    const modal = wrapper.findComponent({ name: 'RtwVerificationModal' });
    await modal.vm.$emit('verified');
    await nextTick();

    expect(mockFetchRtwStatus).toHaveBeenCalled();
    expect(wrapper.findComponent({ name: 'RtwVerificationModal' }).exists()).toBe(false);
  });

  it('closes modal on close emit', async () => {
    mockRtwStatus.value = 'unverified';
    mockRtwLoading.value = false;

    const wrapper = createWrapper();
    await wrapper.find('.settings-action-button').trigger('click');
    await nextTick();

    const modal = wrapper.findComponent({ name: 'RtwVerificationModal' });
    await modal.vm.$emit('close');
    await nextTick();

    expect(wrapper.findComponent({ name: 'RtwVerificationModal' }).exists()).toBe(false);
  });
});
