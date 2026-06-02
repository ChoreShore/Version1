import { ref, onMounted, onBeforeUnmount, watch, toRaw, unref } from 'vue';
import type { Ref } from 'vue';

/**
 * Safely stringify an object for comparison, handling potential circular references
 */
function safeStringify(obj: any): string {
  try {
    // unref handles both refs and plain values
    return JSON.stringify(toRaw(unref(obj)));
  } catch (err) {
    if (import.meta.dev) {
      console.warn('useDirtyForm: Failed to stringify form data, likely due to circular references.', err);
    }
    return '';
  }
}

interface UseDirtyFormOptions {
  /** Form data to watch for changes */
  formData: Record<string, any>;
  /** Custom confirmation message */
  message?: string;
  /** Whether to enable beforeunload handler */
  enableBeforeUnload?: boolean;
}

interface UseDirtyFormReturn {
  /** Whether the form has unsaved changes */
  isDirty: Ref<boolean>;
  /** Reset the dirty state */
  resetDirty: () => void;
  /** Show confirmation dialog and return user's choice */
  confirmNavigation: () => boolean;
}

/**
 * Composable for tracking form dirty state and preventing accidental navigation
 * @param options - Configuration options
 * @returns Dirty state tracking utilities
 */
export function useDirtyForm(options: UseDirtyFormOptions): UseDirtyFormReturn {
  const { formData, message = 'You have unsaved changes. Are you sure you want to leave?', enableBeforeUnload = true } = options;

  const isDirty = ref(false);
  const initialValue = ref(safeStringify(formData));

  // Watch form data for changes (handles both nested mutations and full reassignments)
  watch(
    () => unref(formData),
    () => {
      const currentStringified = safeStringify(formData);
      // Only update dirty state if we could successfully stringify
      if (currentStringified || !initialValue.value) {
        isDirty.value = currentStringified !== initialValue.value;
      }
    },
    { deep: true }
  );

  // Reset dirty state
  const resetDirty = () => {
    isDirty.value = false;
    initialValue.value = safeStringify(formData);
  };

  // Show confirmation dialog
  const confirmNavigation = (): boolean => {
    if (isDirty.value) {
      return window.confirm(message);
    }
    return true;
  };

  // Handle beforeunload event
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty.value) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  // Register/unregister beforeunload handler
  if (enableBeforeUnload) {
    onMounted(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }

  return {
    isDirty,
    resetDirty,
    confirmNavigation
  };
}
