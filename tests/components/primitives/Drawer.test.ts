import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Drawer from '~/components/primitives/Drawer.vue';

const mockUseId = vi.fn(() => 'test-id');

describe('Drawer', () => {
  const mountDrawer = (options: any) => mount(Drawer, {
    ...options,
    global: { stubs: { Teleport: true } }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseId.mockReturnValue('test-id');
    document.body.style.overflow = '';
    (globalThis as any).useId = mockUseId;
    (globalThis as any).useFocusTrap = () => {};
    (globalThis as any).watch = watch;
    (globalThis as any).onMounted = onMounted;
    (globalThis as any).onBeforeUnmount = onBeforeUnmount;
    (globalThis as any).nextTick = nextTick;
  });

  it('does not render when modelValue is false', () => {
    const wrapper = mountDrawer({
      props: { modelValue: false, title: 'Test' }
    });
    expect(wrapper.find('.drawer').exists()).toBe(false);
  });

  it('renders when modelValue is true', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer').exists()).toBe(true);
  });

  it('displays title', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'My Drawer' }
    });
    expect(wrapper.find('.drawer__title').text()).toBe('My Drawer');
  });

  it('displays eyebrow when provided', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', eyebrow: 'Filter' }
    });
    expect(wrapper.find('.drawer__eyebrow').text()).toBe('Filter');
  });

  it('does not render eyebrow when not provided', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer__eyebrow').exists()).toBe(false);
  });

  it('displays description when provided', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', description: 'A description' }
    });
    expect(wrapper.find('.drawer__description').text()).toBe('A description');
  });

  it('renders slot content in body', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' },
      slots: { default: '<p>Body content</p>' }
    });
    expect(wrapper.find('.drawer__body').text()).toContain('Body content');
  });

  it('renders footer slot when provided', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' },
      slots: { footer: '<button>Apply</button>' }
    });
    expect(wrapper.find('.drawer__footer').exists()).toBe(true);
  });

  it('does not render footer when not provided', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer__footer').exists()).toBe(false);
  });

  it('defaults to right placement', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer__panel').classes()).toContain('placement-right');
  });

  it('applies left placement class', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', placement: 'left' }
    });
    expect(wrapper.find('.drawer__panel').classes()).toContain('placement-left');
  });

  it('applies size-sm class', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', size: 'sm' }
    });
    expect(wrapper.find('.drawer__panel').classes()).toContain('size-sm');
  });

  it('applies size-lg class', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', size: 'lg' }
    });
    expect(wrapper.find('.drawer__panel').classes()).toContain('size-lg');
  });

  it('emits update:modelValue false and close when close button clicked', async () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    await wrapper.find('.drawer__close').trigger('click');
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when overlay clicked (closeOnOverlay true)', async () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    await wrapper.find('.drawer__overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not emit close when overlay clicked and closeOnOverlay is false', async () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test', closeOnOverlay: false }
    });
    await wrapper.find('.drawer__overlay').trigger('click');
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('emits open event when modelValue becomes true', async () => {
    const wrapper = mountDrawer({
      props: { modelValue: false, title: 'Test' }
    });
    await wrapper.setProps({ modelValue: true });
    expect(wrapper.emitted('open')).toBeTruthy();
  });

  it('sets body overflow hidden when open', () => {
    mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when closed', async () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    await wrapper.setProps({ modelValue: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('has role="dialog" and aria-modal="true"', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer').attributes('role')).toBe('dialog');
    expect(wrapper.find('.drawer').attributes('aria-modal')).toBe('true');
  });

  it('close button has aria-label="Close"', () => {
    const wrapper = mountDrawer({
      props: { modelValue: true, title: 'Test' }
    });
    expect(wrapper.find('.drawer__close').attributes('aria-label')).toBe('Close');
  });
});
