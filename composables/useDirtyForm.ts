import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import type { Ref } from 'vue';

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
  const initialValue = ref(JSON.stringify(formData));

  // Watch form data for changes
  watch(
    formData,
    () => {
      isDirty.value = JSON.stringify(formData) !== initialValue.value;
    },
    { deep: true }
  );

  // Reset dirty state
  const resetDirty = () => {
    isDirty.value = false;
    initialValue.value = JSON.stringify(formData);
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
