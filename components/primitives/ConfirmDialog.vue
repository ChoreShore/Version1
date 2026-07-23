<script setup lang="ts">
import Button from './Button.vue';

export interface ConfirmDialogProps {
  /** Controls dialog visibility */
  isOpen: boolean;
  /** Dialog title */
  title?: string;
  /** Dialog message */
  message?: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Close when overlay is clicked */
  closeOnOverlayClick?: boolean;
}

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  title: 'Confirm',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  closeOnOverlayClick: true
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const dialogRef = ref<HTMLElement | null>(null);
const titleId = `confirm-title-${useId()}`;

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    handleCancel();
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = open ? 'hidden' : '';
  },
  { immediate: true }
);

useFocusTrap(dialogRef, () => props.isOpen, { onEscape: handleCancel });

onBeforeUnmount(() => {
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        ref="dialogRef"
        class="confirm-dialog-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click="handleOverlayClick"
      >
        <div class="confirm-dialog" @click.stop>
          <div class="confirm-dialog__header">
            <h3 :id="titleId" class="confirm-dialog__title">{{ title }}</h3>
          </div>
          
          <div class="confirm-dialog__body">
            <p class="confirm-dialog__message">{{ message }}</p>
          </div>
          
          <div class="confirm-dialog__actions">
            <Button variant="secondary" @click="handleCancel">
              {{ cancelText }}
            </Button>
            <Button variant="primary" @click="handleConfirm">
              {{ confirmText }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.confirm-dialog {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  animation: modalIn 200ms ease-out;
}

.confirm-dialog__header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.confirm-dialog__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text);
}

.confirm-dialog__body {
  padding: var(--space-6);
}

.confirm-dialog__message {
  margin: 0;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.confirm-dialog__actions {
  padding: var(--space-4) var(--space-6) var(--space-6);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .confirm-dialog-overlay {
    backdrop-filter: none;
  }

  .confirm-dialog {
    animation: none;
  }

  .modal-enter-active,
  .modal-leave-active {
    transition: none;
  }
}
</style>
