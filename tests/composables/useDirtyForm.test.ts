import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import type { Ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useDirtyForm } from '~/composables/useDirtyForm';

function withComposable(fn: () => void) {
  return mount({
    setup() {
      fn();
      return {};
    },
    template: '<div />'
  });
}

describe('useDirtyForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('starts clean when form data matches initial value', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    withComposable(() => {
      const formData = ref({ name: 'Alice' });
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();
    expect(dirtyForm!.isDirty.value).toBe(false);
  });

  it('marks dirty when form data changes', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    const formData = ref({ name: 'Alice' });

    withComposable(() => {
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();

    formData.value.name = 'Bob';
    await nextTick();

    expect(dirtyForm!.isDirty.value).toBe(true);
  });

  it('remains clean after resetDirty', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    const formData = ref({ name: 'Alice' });

    withComposable(() => {
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();

    formData.value.name = 'Bob';
    await nextTick();
    expect(dirtyForm!.isDirty.value).toBe(true);

    dirtyForm!.resetDirty();
    expect(dirtyForm!.isDirty.value).toBe(false);

    formData.value.name = 'Charlie';
    await nextTick();
    expect(dirtyForm!.isDirty.value).toBe(true);
  });

  it('confirmNavigation returns true when clean', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;

    withComposable(() => {
      const formData = ref({ name: 'Alice' });
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();

    const result = dirtyForm!.confirmNavigation();
    expect(result).toBe(true);
    expect(window.confirm).not.toHaveBeenCalled();
  });

  it('confirmNavigation shows dialog when dirty', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    const formData = ref({ name: 'Alice' });

    withComposable(() => {
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();

    formData.value.name = 'Bob';
    await nextTick();

    const result = dirtyForm!.confirmNavigation();
    expect(result).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?');
  });

  it('uses custom confirmation message', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    const formData = ref({ name: 'Alice' });

    withComposable(() => {
      dirtyForm = useDirtyForm({ formData: formData.value, message: 'Custom message', enableBeforeUnload: false });
    });
    await nextTick();

    formData.value.name = 'Bob';
    await nextTick();

    dirtyForm!.confirmNavigation();
    expect(window.confirm).toHaveBeenCalledWith('Custom message');
  });

  it('registers beforeunload handler when enabled', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const wrapper = withComposable(() => {
      const formData = ref({ name: 'Alice' });
      useDirtyForm({ formData: formData.value, enableBeforeUnload: true });
    });
    await nextTick();

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    wrapper.unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does not register beforeunload when disabled', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    withComposable(() => {
      const formData = ref({ name: 'Alice' });
      useDirtyForm({ formData: formData.value, enableBeforeUnload: false });
    });
    await nextTick();

    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(([event]) => (event as string) === 'beforeunload');
    expect(beforeUnloadCalls.length).toBe(0);
  });

  it('beforeunload handler calls preventDefault when dirty', async () => {
    let dirtyForm: ReturnType<typeof useDirtyForm> | null = null;
    const formData = ref({ name: 'Alice' });
    const wrapper = withComposable(() => {
      dirtyForm = useDirtyForm({ formData: formData.value, enableBeforeUnload: true });
    });
    await nextTick();

    formData.value.name = 'Bob';
    await nextTick();

    const event = new Event('beforeunload', { cancelable: true }) as any;
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    wrapper.unmount();
  });
});
