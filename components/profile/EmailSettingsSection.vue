<template>
  <FormErrorBoundary
    form-name="update-email-form"
    @form-error="handleFormError"
    @reset="handleFormReset"
  >
    <form @submit.prevent="handleSubmit" class="email-form">
      <header>
        <h3>Change email</h3>
        <p class="email-form__hint">Update the email address for your account</p>
      </header>

      <div class="email-form__field">
        <span>Current email</span>
        <input
          :value="currentEmail"
          type="email"
          disabled
          class="email-form__input--disabled"
        />
      </div>

      <label class="email-form__field">
        <span>New email</span>
        <input
          v-model="form.newEmail"
          type="email"
          placeholder="Enter new email address"
          :class="{ 'email-form__input--error': fieldErrors.newEmail }"
        />
        <p v-if="fieldErrors.newEmail" class="email-form__field-error">
          {{ fieldErrors.newEmail }}
        </p>
      </label>

      <label class="email-form__field">
        <span>Confirm new email</span>
        <input
          v-model="form.confirmEmail"
          type="email"
          placeholder="Confirm new email address"
          :class="{ 'email-form__input--error': fieldErrors.confirmEmail }"
        />
        <p v-if="fieldErrors.confirmEmail" class="email-form__field-error">
          {{ fieldErrors.confirmEmail }}
        </p>
      </label>

      <label class="email-form__field">
        <span>Current password</span>
        <input
          v-model="form.currentPassword"
          type="password"
          placeholder="Enter current password"
          :class="{ 'email-form__input--error': fieldErrors.currentPassword }"
        />
        <p v-if="fieldErrors.currentPassword" class="email-form__field-error">
          {{ fieldErrors.currentPassword }}
        </p>
      </label>

      <p v-if="error" class="email-form__error">{{ error }}</p>
      <p v-if="success" class="email-form__success">{{ success }}</p>

      <button type="submit" class="email-form__button" :disabled="submitting || !isFormValid">
        {{ submitting ? 'Updating...' : 'Update email' }}
      </button>
    </form>
  </FormErrorBoundary>

  <ConfirmDialog
    :is-open="showConfirmDialog"
    title="Unsaved Changes"
    message="You have unsaved changes. Are you sure you want to cancel?"
    confirm-text="Cancel"
    cancel-text="Continue"
    @confirm="handleDialogConfirm"
    @cancel="handleDialogCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { UpdateEmailSchema } from '~/schemas/auth';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';
import { useDirtyForm } from '~/composables/useDirtyForm';

const { updateEmail } = useAuth();
const user = useSupabaseUser();

const currentEmail = computed(() => user.value?.email ?? '');

const form = ref({
  newEmail: '',
  confirmEmail: '',
  currentPassword: ''
});

const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const showConfirmDialog = ref(false);

// Use dirty form composable
const { isDirty, resetDirty } = useDirtyForm({
  formData: form,
  message: 'You have unsaved changes. Are you sure you want to cancel?',
  enableBeforeUnload: true
});

const fieldErrors = computed(() => {
  const result = UpdateEmailSchema.safeParse(form.value);

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
         form.value.newEmail.length > 0 &&
         form.value.confirmEmail.length > 0 &&
         form.value.currentPassword.length > 0;
});

const handleSubmit = async () => {
  error.value = null;
  success.value = null;

  const validation = UpdateEmailSchema.safeParse(form.value);
  if (!validation.success) {
    return;
  }

  submitting.value = true;

  try {
    const result = await updateEmail(validation.data);
    success.value = result.message;
    form.value = { newEmail: '', confirmEmail: '', currentPassword: '' };
    resetDirty();
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to update email';
  } finally {
    submitting.value = false;
  }
};

const handleDialogConfirm = () => {
  showConfirmDialog.value = false;
  form.value = { newEmail: '', confirmEmail: '', currentPassword: '' };
  error.value = null;
  success.value = null;
  resetDirty();
};

const handleDialogCancel = () => {
  showConfirmDialog.value = false;
};

const handleFormError = (error: Error, formName?: string) => {
  if (import.meta.dev) {
    console.error(`Form error in ${formName}:`, error);
  }
};

const handleFormReset = () => {
  form.value = { newEmail: '', confirmEmail: '', currentPassword: '' };
  error.value = null;
  success.value = null;
  resetDirty();
};
</script>

<style scoped>
.email-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.email-form header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.email-form h3 {
  margin: 0;
  font-size: var(--text-lg);
}

.email-form__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.email-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.email-form__field span {
  font-weight: 600;
  font-size: var(--text-sm);
}

.email-form__field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
}

.email-form__field input:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: -1px;
}

.email-form__input--disabled {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.email-form__input--error {
  border-color: var(--color-danger) !important;
}

.email-form__input--error:focus {
  outline-color: var(--color-danger) !important;
}

.email-form__field-error {
  margin: var(--space-1) 0 0 0;
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.email-form__error {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.email-form__success {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.email-form__button {
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

.email-form__button:hover:not(:disabled) {
  background: var(--color-primary-600);
}

.email-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
