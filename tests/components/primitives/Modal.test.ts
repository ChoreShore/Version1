import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import Modal from '~/components/primitives/Modal.vue';

const mockUseId = vi.fn(() => 'test-id');

describe('Modal', () => {
  const mountModal = (options: any) => mount(Modal, {
    ...options,
    global: { stubs: { Teleport: true } }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseId.mockReturnValue('test-id');
    document.body.style.overflow = '';
    (globalThis as any).useFocusTrap = () => {};
    (globalThis as any).useId = mockUseId;
    (globalThis as any).watch = watch;
    (globalThis as any).onMounted = onMounted;
    (globalThis as any).onBeforeUnmount = onBeforeUnmount;
  });

  it('does not render when modelValue is false', () => {
    const wrapper = mountModal({
      props: { modelValue: false, title: 'Test' },
      slots: { default: 'Content' }
    });
    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('renders when modelValue is true', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' },
      slots: { default: 'Content' }
    });
    expect(wrapper.find('.modal').exists()).toBe(true);
  });

  it('displays title', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'My Modal' }
    });
    expect(wrapper.find('.modal__title').text()).toBe('My Modal');
  });

  it('displays eyebrow when provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', eyebrow: 'Settings' }
    });
    expect(wrapper.find('.modal__eyebrow').text()).toBe('Settings');
  });

  it('does not render eyebrow when not provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.modal__eyebrow').exists()).toBe(false);
  });

  it('displays description when provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', description: 'A description' }
    });
    expect(wrapper.find('.modal__description').text()).toBe('A description');
  });

  it('does not render description when not provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.modal__description').exists()).toBe(false);
  });

  it('renders slot content in body', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' },
      slots: { default: '<p>Body content</p>' }
    });
    expect(wrapper.find('.modal__body').text()).toContain('Body content');
  });

  it('renders footer slot when provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' },
      slots: { footer: '<button>Save</button>' }
    });
    expect(wrapper.find('.modal__footer').exists()).toBe(true);
    expect(wrapper.find('.modal__footer').text()).toContain('Save');
  });

  it('does not render footer when not provided', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.modal__footer').exists()).toBe(false);
  });

  it('applies size-sm class', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', size: 'sm' }
    });
    expect(wrapper.find('.modal__panel').classes()).toContain('size-sm');
  });

  it('applies size-lg class', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', size: 'lg' }
    });
    expect(wrapper.find('.modal__panel').classes()).toContain('size-lg');
  });

  it('emits update:modelValue false and close when close button clicked', async () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    await wrapper.find('.modal__close').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when overlay is clicked (closeOnOverlay true)', async () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', closeOnOverlay: true }
    });
    await wrapper.find('.modal__overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
  });

  it('does not emit close when overlay clicked and closeOnOverlay is false', async () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test', closeOnOverlay: false }
    });
    await wrapper.find('.modal__overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.modal').attributes('role')).toBe('dialog');
    expect(wrapper.find('.modal').attributes('aria-modal')).toBe('true');
  });

  it('sets aria-labelledby to title id', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    const modal = wrapper.find('.modal');
    const titleId = modal.attributes('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(wrapper.find('.modal__title').attributes('id')).toBe(titleId);
  });

  it('emits open event when modelValue becomes true', async () => {
    const wrapper = mountModal({
      props: { modelValue: false, title: 'Test' }
    });
    await wrapper.setProps({ modelValue: true });
    expect(wrapper.emitted('open')).toBeTruthy();
  });

  it('sets body overflow hidden when open', async () => {
    mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when closed', async () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    await wrapper.setProps({ modelValue: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('close button has aria-label="Close"', () => {
    const wrapper = mountModal({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.modal__close').attributes('aria-label')).toBe('Close');
  });
});
