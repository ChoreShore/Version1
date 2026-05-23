<template>
  <div v-if="isWorker" class="bio-settings">
    <header class="bio-settings__header">
      <h2>Worker bio</h2>
      <p class="bio-settings__subtitle">Tell employers about yourself and your skills</p>
    </header>

    <div class="bio-settings__body">
      <div v-if="isLoading" class="bio-settings__loading">Loading...</div>

      <div v-else class="bio-settings__content">
        <form @submit.prevent="handleSave" class="bio-settings__form">
          <FormField id="bio" :error="error" :state="error ? 'error' : 'default'">
            <FormLabel for="bio">Your bio</FormLabel>
            <FormControl>
              <textarea
                id="bio"
                v-model="bio"
                class="bio-settings__textarea"
                placeholder="Write a short bio about yourself..."
                :disabled="saving"
                rows="4"
                maxlength="500"
                @input="handleInput"
              ></textarea>
            </FormControl>
            <FormHint>
              {{ bio.length }}/500 characters
            </FormHint>
            <FormError v-if="error">{{ error }}</FormError>
          </FormField>

          <button
            type="submit"
            class="bio-settings__button"
            :disabled="saving || !hasChanges"
          >
            {{ saving ? 'Saving...' : 'Save bio' }}
          </button>
        </form>

        <div v-if="success" class="bio-settings__success" role="status">
          Bio saved successfully
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useActiveRole } from '~/composables/useActiveRole';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormError from '~/components/primitives/form/FormError.vue';

const { isWorker } = useActiveRole();
const user = useSupabaseUser();
const client = useSupabaseClient();

const bio = ref('');
const originalBio = ref('');
const isLoading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const hasChanges = computed(() => bio.value !== originalBio.value);

const fetchBio = async () => {
  if (!user.value) return;

  try {
    const { data, error: fetchError } = await client
      .from('profiles')
      .select('bio')
      .eq('id', user.value.id)
      .single();

    if (fetchError) throw fetchError;

    const bioValue = (data as any)?.bio || '';
    bio.value = bioValue;
    originalBio.value = bioValue;
  } catch (err: any) {
    error.value = err.message || 'Failed to load bio';
  } finally {
    isLoading.value = false;
  }
};

const handleInput = () => {
  error.value = null;
  success.value = null;
};

const handleSave = async () => {
  if (saving.value) return;

  saving.value = true;
  error.value = null;
  success.value = null;

  try {
    const response = await $fetch<{ success: boolean; bio: string | null }>('/api/profile/bio', {
      method: 'PATCH',
      body: { bio: bio.value || null }
    });

    if (response.success) {
      originalBio.value = bio.value;
      success.value = 'Bio saved successfully';
      
      setTimeout(() => {
        success.value = null;
      }, 3000);
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.message || 'Failed to save bio';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  if (isWorker.value) {
    fetchBio();
  }
});
</script>

<style scoped>
.bio-settings {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
}

.bio-settings__header {
  margin-bottom: var(--space-4);
}

.bio-settings__header h2 {
  margin: 0;
  font-size: var(--text-lg);
}

.bio-settings__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.bio-settings__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bio-settings__loading {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.bio-settings__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bio-settings__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bio-settings__textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: inherit;
  resize: vertical;
  transition: border-color 150ms var(--ease-out);
}

.bio-settings__textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.bio-settings__textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bio-settings__button {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-primary-600);
  color: white;
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  border: none;
  transition: background 150ms var(--ease-out);
  align-self: flex-start;
}

.bio-settings__button:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.bio-settings__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.bio-settings__success {
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
</style>
