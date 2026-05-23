<template>
  <div class="complete-profile-page">
    <div class="complete-profile-container">
      <div class="complete-profile-card">
        <header class="complete-profile-header">
          <h1 class="complete-profile-title">Complete your profile</h1>
          <p class="complete-profile-subtitle">Upload a photo to finish setting up your account</p>
        </header>

        <div class="complete-profile-body">
          <PhotoUpload
            :current-photo-url="currentPhotoUrl"
            @upload-success="handleUploadSuccess"
          />

          <div v-if="error" class="complete-profile-error" role="alert">
            {{ error }}
          </div>

          <div v-if="success" class="complete-profile-success" role="status">
            Photo uploaded successfully. Redirecting to dashboard...
          </div>
        </div>

        <footer class="complete-profile-footer">
          <p class="complete-profile-note">
            This photo will be visible to other users on the platform
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PhotoUpload from '~/components/primitives/PhotoUpload.vue';

definePageMeta({
  layout: false,
  title: 'Complete Profile - HireBeHired'
});

const router = useRouter();
const user = useSupabaseUser();
const client = useSupabaseClient();

const currentPhotoUrl = ref<string | null>(null);
const error = ref<string | null>(null);
const success = ref(false);

const fetchProfile = async () => {
  if (!user.value) return;

  try {
    const { data, error: fetchError } = await client
      .from('profiles')
      .select('photo_url')
      .eq('id', user.value.id)
      .single();

    if (fetchError) throw fetchError;

    currentPhotoUrl.value = (data as any)?.photo_url || null;

    // If user already has a photo, redirect to dashboard
    if (currentPhotoUrl.value) {
      router.push('/dashboard');
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load profile';
  }
};

const handleUploadSuccess = (photoUrl: string) => {
  success.value = true;
  currentPhotoUrl.value = photoUrl;
  
  // Redirect to dashboard after a short delay
  setTimeout(() => {
    router.push('/dashboard');
  }, 1500);
};

onMounted(() => {
  if (!user.value) {
    router.push('/auth/sign-in');
    return;
  }

  fetchProfile();
});
</script>

<style scoped>
.complete-profile-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
  padding: var(--space-4);
}

.complete-profile-container {
  width: 100%;
  max-width: 500px;
}

.complete-profile-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-8);
}

.complete-profile-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.complete-profile-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.complete-profile-subtitle {
  color: var(--color-gray-600);
  font-size: var(--text-base);
  margin: 0;
}

.complete-profile-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  align-items: center;
}

.complete-profile-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-200);
  font-size: var(--text-sm);
  text-align: center;
}

.complete-profile-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-success-200);
  font-size: var(--text-sm);
  text-align: center;
}

.complete-profile-footer {
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-gray-200);
  text-align: center;
}

.complete-profile-note {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--text-sm);
}
</style>
