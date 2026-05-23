<template>
  <div class="photo-upload-modal">
    <div class="photo-upload-modal__overlay" @click="handleClose"></div>
    <div class="photo-upload-modal__content">
      <header class="photo-upload-modal__header">
        <h2>{{ title }}</h2>
        <button
          type="button"
          class="photo-upload-modal__close"
          @click="handleClose"
          :disabled="uploading"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </header>

      <div class="photo-upload-modal__body">
        <p class="photo-upload-modal__message">{{ message }}</p>
        
        <PhotoUpload
          :current-photo-url="currentPhotoUrl"
          @upload-success="handleUploadSuccess"
          @delete-success="handleDeleteSuccess"
          @upload-error="handleUploadError"
        />

        <div v-if="error" class="photo-upload-modal__error" role="alert">
          {{ error }}
        </div>
      </div>

      <footer v-if="!required" class="photo-upload-modal__footer">
        <button
          type="button"
          class="photo-upload-modal__button photo-upload-modal__button--secondary"
          @click="handleClose"
          :disabled="uploading"
        >
          Maybe later
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import PhotoUpload from '~/components/primitives/PhotoUpload.vue';

interface Props {
  isOpen?: boolean;
  currentPhotoUrl?: string | null;
  required?: boolean;
  title?: string;
  message?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  currentPhotoUrl: null,
  required: false,
  title: 'Upload your photo',
  message: 'Please upload a profile photo to continue'
});

const emit = defineEmits<{
  close: [];
  uploadSuccess: [photoUrl: string];
  deleteSuccess: [];
}>();

const uploading = ref(false);
const error = ref<string | null>(null);

const handleClose = () => {
  if (uploading.value) return;
  error.value = null;
  emit('close');
};

const handleUploadSuccess = (photoUrl: string) => {
  error.value = null;
  emit('uploadSuccess', photoUrl);
  if (props.required) {
    emit('close');
  }
};

const handleDeleteSuccess = () => {
  error.value = null;
  emit('deleteSuccess');
};

const handleUploadError = (errorMessage: string) => {
  error.value = errorMessage;
};
</script>

<style scoped>
.photo-upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.photo-upload-modal__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.photo-upload-modal__content {
  position: relative;
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.photo-upload-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.photo-upload-modal__header h2 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
}

.photo-upload-modal__close {
  background: none;
  border: none;
  padding: var(--space-2);
  cursor: pointer;
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.photo-upload-modal__close:hover:not(:disabled) {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.photo-upload-modal__close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.photo-upload-modal__close svg {
  width: 20px;
  height: 20px;
}

.photo-upload-modal__body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.photo-upload-modal__message {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-base);
  text-align: center;
}

.photo-upload-modal__error {
  padding: var(--space-3);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  text-align: center;
}

.photo-upload-modal__footer {
  padding: var(--space-6);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

.photo-upload-modal__button {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.photo-upload-modal__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.photo-upload-modal__button--secondary {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.photo-upload-modal__button--secondary:hover:not(:disabled) {
  background: var(--color-surface-muted-hover);
}
</style>
