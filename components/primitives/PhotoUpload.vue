<template>
  <div class="photo-upload">
    <div v-if="currentPhotoUrl" class="photo-upload__preview">
      <img :src="currentPhotoUrl" alt="Profile photo" class="photo-upload__image" />
      <div class="photo-upload__actions">
        <button
          type="button"
          class="photo-upload__button photo-upload__button--change"
          @click="triggerFileInput"
          :disabled="uploading"
        >
          {{ uploading ? 'Uploading...' : 'Change photo' }}
        </button>
        <button
          type="button"
          class="photo-upload__button photo-upload__button--delete"
          @click="handleDelete"
          :disabled="uploading"
        >
          Delete
        </button>
      </div>
    </div>

    <div v-else-if="previewUrl" class="photo-upload__preview">
      <img :src="previewUrl" alt="Photo preview" class="photo-upload__image" />
      <div class="photo-upload__actions">
        <button
          type="button"
          class="photo-upload__button photo-upload__button--upload"
          @click="handleUpload"
          :disabled="uploading"
        >
          {{ uploading ? 'Uploading...' : 'Upload photo' }}
        </button>
        <button
          type="button"
          class="photo-upload__button photo-upload__button--cancel"
          @click="handleCancel"
          :disabled="uploading"
        >
          Cancel
        </button>
      </div>
    </div>

    <div
      v-else
      class="photo-upload__dropzone"
      :class="{ 'photo-upload__dropzone--dragover': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="handleFileSelect"
        class="photo-upload__input"
      />
      <div class="photo-upload__content">
        <svg class="photo-upload__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="photo-upload__text">
          <button type="button" class="photo-upload__link" @click="triggerFileInput">
            Click to upload
          </button>
          or drag and drop
        </p>
        <p class="photo-upload__hint">JPG, PNG, or WebP (max 5MB)</p>
      </div>
    </div>

    <div v-if="error" class="photo-upload__error" role="alert">
      {{ error }}
    </div>

    <div v-if="uploadProgress > 0 && uploading" class="photo-upload__progress">
      <div class="photo-upload__progress-bar" :style="{ width: `${uploadProgress}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { validatePhotoUpload } from '~/schemas/profile';

interface Props {
  currentPhotoUrl?: string | null;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentPhotoUrl: null,
  required: false
});

const emit = defineEmits<{
  uploadSuccess: [photoUrl: string];
  uploadError: [error: string];
  deleteSuccess: [];
  uploadStart: [];
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const uploading = ref(false);
const uploadProgress = ref(0);
const isDragOver = ref(false);
const error = ref<string | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const validateFile = (file: File): boolean => {
  error.value = null;

  const validation = validatePhotoUpload({ photo: file });
  if (!validation.success) {
    error.value = validation.errors?.photo || 'Invalid photo file';
    return false;
  }

  return true;
};

const createPreview = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && validateFile(file)) {
    selectedFile.value = file;
    createPreview(file);
  }
  // Reset input so same file can be selected again
  target.value = '';
};

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file && validateFile(file)) {
    selectedFile.value = file;
    createPreview(file);
  }
};

const handleUpload = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  error.value = null;
  emit('uploadStart');

  try {
    const formData = new FormData();
    formData.append('photo', selectedFile.value);

    // Simulate progress (since we don't have actual progress from fetch)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 100);

    const response = await $fetch<{ success: boolean; photoUrl: string }>('/api/profile/photo', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    if (response.success && response.photoUrl) {
      emit('uploadSuccess', response.photoUrl);
      selectedFile.value = null;
      previewUrl.value = null;
    } else {
      throw new Error('Upload failed');
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to upload photo';
    if (error.value) {
      emit('uploadError', error.value);
    }
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = 0;
    }, 500);
  }
};

const handleDelete = async () => {
  if (!props.currentPhotoUrl) return;

  uploading.value = true;
  error.value = null;

  try {
    await $fetch('/api/profile/photo', {
      method: 'DELETE'
    });
    emit('deleteSuccess');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to delete photo';
  } finally {
    uploading.value = false;
  }
};

const handleCancel = () => {
  selectedFile.value = null;
  previewUrl.value = null;
  error.value = null;
};
</script>

<style scoped>
.photo-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.photo-upload__preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: center;
}

.photo-upload__image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
}

.photo-upload__actions {
  display: flex;
  gap: var(--space-2);
}

.photo-upload__button {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.photo-upload__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.photo-upload__button--upload,
.photo-upload__button--change {
  background: var(--color-primary-600);
  color: white;
}

.photo-upload__button--upload:hover:not(:disabled),
.photo-upload__button--change:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.photo-upload__button--delete {
  background: var(--color-danger-600);
  color: white;
}

.photo-upload__button--delete:hover:not(:disabled) {
  background: var(--color-danger-700);
}

.photo-upload__button--cancel {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.photo-upload__button--cancel:hover:not(:disabled) {
  background: var(--color-surface-muted-hover);
}

.photo-upload__dropzone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.photo-upload__dropzone--dragover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.photo-upload__input {
  display: none;
}

.photo-upload__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
}

.photo-upload__icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-muted);
}

.photo-upload__text {
  margin: 0;
  color: var(--color-text);
  font-size: var(--text-base);
}

.photo-upload__link {
  background: none;
  border: none;
  color: var(--color-primary-600);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
}

.photo-upload__link:hover {
  text-decoration: underline;
  color: var(--color-primary-700);
}

.photo-upload__hint {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.photo-upload__error {
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.photo-upload__progress {
  height: 4px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.photo-upload__progress-bar {
  height: 100%;
  background: var(--color-primary-600);
  transition: width 0.3s ease;
}
</style>
