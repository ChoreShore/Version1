<template>
  <FormErrorBoundary 
    form-name="delete-account-form"
    @form-error="handleFormError"
    @reset="handleFormReset"
  >
    <form @submit.prevent="handleSubmit" class="delete-form">
      <header>
        <h3>Delete account</h3>
        <p class="delete-form__warning">
          ⚠️ This action cannot be undone. All your data will be permanently deleted.
        </p>
      </header>

      <label class="delete-form__field">
        <span>Type <strong>DELETE</strong> to confirm</span>
        <input
          v-model="form.confirmation"
          type="text"
          placeholder="DELETE"
          :class="{ 'delete-form__input--error': fieldErrors.confirmation }"
        />
        <p v-if="fieldErrors.confirmation" class="delete-form__field-error">
          {{ fieldErrors.confirmation }}
        </p>
      </label>

      <label class="delete-form__field">
        <span>Enter your password</span>
        <input
          v-model="form.password"
          type="password"
          placeholder="Enter your password"
          :class="{ 'delete-form__input--error': fieldErrors.password }"
        />
        <p v-if="fieldErrors.password" class="delete-form__field-error">
          {{ fieldErrors.password }}
        </p>
      </label>

      <p v-if="error" class="delete-form__error">{{ error }}</p>

      <button type="submit" class="delete-form__button" :disabled="submitting || !isFormValid">
        {{ submitting ? 'Deleting account...' : 'Delete my account' }}
      </button>
    </form>
  </FormErrorBoundary>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DeleteAccountSchema } from '~/schemas/auth';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';

const { deleteAccount } = useAuth();
const router = useRouter();

const form = ref({
  confirmation: '',
  password: ''
});

const submitting = ref(false);
const error = ref<string | null>(null);

const fieldErrors = computed(() => {
  const result = DeleteAccountSchema.safeParse(form.value);
  
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
         form.value.confirmation === 'DELETE' &&
         form.value.password.length > 0;
});

const handleSubmit = async () => {
  error.value = null;

  const validation = DeleteAccountSchema.safeParse(form.value);
  if (!validation.success) {
    return;
  }

  submitting.value = true;

  try {
    await deleteAccount(validation.data);
    await router.push('/');
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to delete account';
    submitting.value = false;
  }
};

const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
};

const handleFormReset = () => {
  form.value = { confirmation: '', password: '' };
  error.value = null;
};
</script>

<style scoped>
.delete-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.delete-form header {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.delete-form h3 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-danger);
}

.delete-form__warning {
  margin: 0;
  padding: var(--space-3);
  background: #fef2f2;
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}

.delete-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.delete-form__field span {
  font-weight: 600;
  font-size: var(--text-sm);
}

.delete-form__field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
}

.delete-form__field input:focus {
  outline: 2px solid var(--color-danger);
  outline-offset: -1px;
}

.delete-form__input--error {
  border-color: var(--color-danger) !important;
}

.delete-form__field-error {
  margin: var(--space-1) 0 0 0;
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.delete-form__error {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.delete-form__button {
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger) !important;
  color: white !important;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
}

.delete-form__button:hover:not(:disabled) {
  background: #b91c1c;
}

.delete-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
