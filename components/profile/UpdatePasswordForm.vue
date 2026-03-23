<template>
  <FormErrorBoundary 
    form-name="update-password-form"
    @form-error="handleFormError"
    @reset="handleFormReset"
  >
    <form @submit.prevent="handleSubmit" class="password-form">
      <header>
        <h3>Change password</h3>
        <p class="password-form__hint">Update your account password</p>
      </header>

      <label class="password-form__field">
        <span>Current password</span>
        <input
          v-model="form.currentPassword"
          type="password"
          placeholder="Enter current password"
          :class="{ 'password-form__input--error': fieldErrors.currentPassword }"
        />
        <p v-if="fieldErrors.currentPassword" class="password-form__field-error">
          {{ fieldErrors.currentPassword }}
        </p>
      </label>

      <label class="password-form__field">
        <span>New password</span>
        <input
          v-model="form.newPassword"
          type="password"
          placeholder="Enter new password"
          :class="{ 'password-form__input--error': fieldErrors.newPassword }"
        />
        <p v-if="fieldErrors.newPassword" class="password-form__field-error">
          {{ fieldErrors.newPassword }}
        </p>
      </label>

      <label class="password-form__field">
        <span>Confirm new password</span>
        <input
          v-model="form.confirmPassword"
          type="password"
          placeholder="Confirm new password"
          :class="{ 'password-form__input--error': fieldErrors.confirmPassword }"
        />
        <p v-if="fieldErrors.confirmPassword" class="password-form__field-error">
          {{ fieldErrors.confirmPassword }}
        </p>
      </label>

      <p v-if="error" class="password-form__error">{{ error }}</p>
      <p v-if="success" class="password-form__success">{{ success }}</p>

      <button type="submit" class="password-form__button" :disabled="submitting || !isFormValid">
        {{ submitting ? 'Updating...' : 'Update password' }}
      </button>
    </form>
  </FormErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UpdatePasswordSchema } from '~/schemas/auth';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';

const { updatePassword } = useAuth();

const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const fieldErrors = computed(() => {
  const result = UpdatePasswordSchema.safeParse(form.value);
  
  if (!result.success) {
    return result.error.issues.reduce((acc, issue) => {
      const field = issue.path[0] as string;
      acc[field] = issue.message;
      return acc;
    }, {} as Record<string, string>);
  }
  
  return {};
});

const isFormValid = computed(() => {
  return Object.keys(fieldErrors.value).length === 0 && 
         form.value.currentPassword.length > 0 &&
         form.value.newPassword.length >= 8;
});

const handleSubmit = async () => {
  error.value = null;
  success.value = null;

  const validation = UpdatePasswordSchema.safeParse(form.value);
  if (!validation.success) {
    return;
  }

  submitting.value = true;

  try {
    const result = await updatePassword(validation.data);
    success.value = result.message;
    form.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to update password';
  } finally {
    submitting.value = false;
  }
};

const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
};

const handleFormReset = () => {
  form.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  error.value = null;
  success.value = null;
};
</script>

<style scoped>
.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.password-form header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.password-form h3 {
  margin: 0;
  font-size: var(--text-lg);
}

.password-form__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.password-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.password-form__field span {
  font-weight: 600;
  font-size: var(--text-sm);
}

.password-form__field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
}

.password-form__field input:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -1px;
}

.password-form__input--error {
  border-color: var(--color-danger) !important;
}

.password-form__input--error:focus {
  outline-color: var(--color-danger) !important;
}

.password-form__field-error {
  margin: var(--space-1) 0 0 0;
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.password-form__error {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.password-form__success {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.password-form__button {
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-500) !important;
  color: white !important;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
}

.password-form__button:hover:not(:disabled) {
  background: var(--color-primary-600);
}

.password-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
