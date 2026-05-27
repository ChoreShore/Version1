<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="confirm-dialog-overlay" @click="handleOverlayClick">
        <div class="confirm-dialog" @click.stop>
          <div class="confirm-dialog__header">
            <h3 class="confirm-dialog__title">{{ title }}</h3>
          </div>
          
          <div class="confirm-dialog__body">
            <p class="confirm-dialog__message">{{ message }}</p>
          </div>
          
          <div class="confirm-dialog__actions">
            <button 
              type="button" 
              class="confirm-dialog__button confirm-dialog__button--cancel"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button 
              type="button" 
              class="confirm-dialog__button confirm-dialog__button--confirm"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  closeOnOverlayClick?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
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
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 26, 26, 0.35);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.confirm-dialog {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  animation: modalIn 200ms ease-out;
}

.confirm-dialog__header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.confirm-dialog__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text);
}

.confirm-dialog__body {
  padding: var(--space-6);
}

.confirm-dialog__message {
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
}

.confirm-dialog__actions {
  padding: var(--space-4) var(--space-6) var(--space-6);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  border-top: 1px solid var(--border);
}

.confirm-dialog__button {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 150ms ease;
  border: none;
}

.confirm-dialog__button--cancel {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.confirm-dialog__button--cancel:hover {
  background: var(--hover);
}

.confirm-dialog__button--confirm {
  background: var(--dark);
  color: white;
}

.confirm-dialog__button--confirm:hover {
  background: var(--success);
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
