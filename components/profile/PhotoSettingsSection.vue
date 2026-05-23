<template>
  <div class="photo-settings">
    <header class="photo-settings__header">
      <h2>Profile photo</h2>
      <p class="photo-settings__subtitle">Manage your profile photo</p>
    </header>

    <div class="photo-settings__body">
      <div v-if="isLoading" class="photo-settings__loading">Loading...</div>

      <div v-else class="photo-settings__content">
        <PhotoUpload
          :current-photo-url="currentPhotoUrl"
          @upload-success="handleUploadSuccess"
          @delete-success="handleDeleteSuccess"
          @upload-error="handleUploadError"
        />

        <div v-if="error" class="photo-settings__error" role="alert">
          {{ error }}
        </div>

        <div v-if="success" class="photo-settings__success" role="status">
          {{ success }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import PhotoUpload from '~/components/primitives/PhotoUpload.vue';

const user = useSupabaseUser();
const client = useSupabaseClient();

const currentPhotoUrl = ref<string | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const fetchPhoto = async () => {
  if (!user.value) return;

  try {
    const { data, error: fetchError } = await client
      .from('profiles')
      .select('photo_url')
      .eq('id', user.value.id)
      .single();

    if (fetchError) throw fetchError;

    currentPhotoUrl.value = (data as any)?.photo_url || null;
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile photo';
  } finally {
    isLoading.value = false;
  }
};

const handleUploadSuccess = (photoUrl: string) => {
  currentPhotoUrl.value = photoUrl;
  success.value = 'Photo updated successfully';
  error.value = null;
  
  setTimeout(() => {
    success.value = null;
  }, 3000);
};

const handleDeleteSuccess = () => {
  currentPhotoUrl.value = null;
  success.value = 'Photo removed successfully';
  error.value = null;
  
  setTimeout(() => {
    success.value = null;
  }, 3000);
};

const handleUploadError = (errorMessage: string) => {
  error.value = errorMessage;
  success.value = null;
};

onMounted(() => {
  fetchPhoto();
});
</script>

<style scoped>
.photo-settings {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
}

.photo-settings__header {
  margin-bottom: var(--space-4);
}

.photo-settings__header h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.photo-settings__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.photo-settings__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.photo-settings__loading {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.photo-settings__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.photo-settings__error {
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.photo-settings__success {
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
</style>
