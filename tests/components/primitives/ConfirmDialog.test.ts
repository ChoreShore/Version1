import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { watch, onMounted, onBeforeUnmount } from 'vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';

const mockUseId = vi.fn(() => 'test-id');

describe('ConfirmDialog', () => {
  const mountDialog = (options: any) => mount(ConfirmDialog, {
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

  it('does not render when isOpen is false', () => {
    const wrapper = mountDialog({
      props: { isOpen: false }
    });
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false);
  });

  it('renders when isOpen is true', () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(true);
  });

  it('displays default title', () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    expect(wrapper.find('.confirm-dialog__title').text()).toBe('Confirm');
  });

  it('displays custom title', () => {
    const wrapper = mountDialog({
      props: { isOpen: true, title: 'Delete item?' }
    });
    expect(wrapper.find('.confirm-dialog__title').text()).toBe('Delete item?');
  });

  it('displays default message', () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    expect(wrapper.find('.confirm-dialog__message').text()).toBe('Are you sure?');
  });

  it('displays custom message', () => {
    const wrapper = mountDialog({
      props: { isOpen: true, message: 'This action cannot be undone.' }
    });
    expect(wrapper.find('.confirm-dialog__message').text()).toBe('This action cannot be undone.');
  });

  it('displays custom confirm and cancel text', () => {
    const wrapper = mountDialog({
      props: { isOpen: true, confirmText: 'Delete', cancelText: 'Keep' }
    });
    const buttons = wrapper.findAll('button');
    expect(buttons.some(b => b.text().includes('Delete'))).toBe(true);
    expect(buttons.some(b => b.text().includes('Keep'))).toBe(true);
  });

  it('emits confirm when confirm button clicked', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    const buttons = wrapper.findAll('button');
    const confirmBtn = buttons.find(b => b.text().includes('Confirm'));
    await confirmBtn!.trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel when cancel button clicked', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    const buttons = wrapper.findAll('button');
    const cancelBtn = buttons.find(b => b.text().includes('Cancel'));
    await cancelBtn!.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when overlay clicked and closeOnOverlayClick is true', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true, closeOnOverlayClick: true }
    });
    await wrapper.find('.confirm-dialog-overlay').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('does not emit cancel when overlay clicked and closeOnOverlayClick is false', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true, closeOnOverlayClick: false }
    });
    await wrapper.find('.confirm-dialog-overlay').trigger('click');
    expect(wrapper.emitted('cancel')).toBeFalsy();
  });

  it('does not emit cancel when clicking inside dialog', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    await wrapper.find('.confirm-dialog').trigger('click');
    expect(wrapper.emitted('cancel')).toBeFalsy();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    expect(wrapper.find('.confirm-dialog-overlay').attributes('role')).toBe('dialog');
    expect(wrapper.find('.confirm-dialog-overlay').attributes('aria-modal')).toBe('true');
  });

  it('sets aria-labelledby to title id', () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    const overlay = wrapper.find('.confirm-dialog-overlay');
    const titleId = overlay.attributes('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(wrapper.find('.confirm-dialog__title').attributes('id')).toBe(titleId);
  });

  it('sets body overflow hidden when open', () => {
    mountDialog({
      props: { isOpen: true }
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when closed', async () => {
    const wrapper = mountDialog({
      props: { isOpen: true }
    });
    await wrapper.setProps({ isOpen: false });
    expect(document.body.style.overflow).toBe('');
  });
});
