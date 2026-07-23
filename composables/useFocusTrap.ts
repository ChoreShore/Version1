import { type Ref, watch, onBeforeUnmount, nextTick } from 'vue';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isActive: () => boolean,
  options?: { autoFocus?: boolean; onEscape?: () => void }
) {
  const trapFocus = (event: KeyboardEvent) => {
    if (!isActive() || event.key !== 'Tab') {
      return;
    }

    const focusable = containerRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (!focusable || focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && options?.onEscape) {
      options.onEscape();
    }
    trapFocus(event);
  };

  const addListeners = () => {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', handleKeydown);
  };

  const removeListeners = () => {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', handleKeydown);
  };

  watch(
    () => isActive(),
    (active) => {
      if (active) {
        if (options?.autoFocus !== false) {
          nextTick(() => {
            const focusable = containerRef.value?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            focusable?.[0]?.focus();
          });
        }
        addListeners();
      } else {
        removeListeners();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    removeListeners();
  });
}
