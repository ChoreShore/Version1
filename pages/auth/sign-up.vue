<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join HireBeHired to find work or hire talent</p>
        </header>

        <FormErrorBoundary 
          form-name="sign-up-form"
          @form-error="handleFormError"
          @reset="handleFormReset"
        >
          <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
            <!-- First Name Field -->
            <FormField id="first_name" :error="errors.first_name" :state="getFieldState('first_name')">
              <FormLabel for="first_name">First Name</FormLabel>
              <FormControl>
                <input
                  id="first_name"
                  v-model="form.first_name"
                  type="text"
                  placeholder="Enter your first name"
                  :disabled="loading"
                  autocomplete="given-name"
                  required
                  @input="validateField('first_name')"
                  @blur="validateField('first_name')"
                />
              </FormControl>
              <FormError v-if="errors.first_name">{{ errors.first_name }}</FormError>
              <FormSuccess v-if="!errors.first_name && form.first_name.length > 0"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Last Name Field -->
            <FormField id="last_name" :error="errors.last_name" :state="getFieldState('last_name')">
              <FormLabel for="last_name">Last Name</FormLabel>
              <FormControl>
                <input
                  id="last_name"
                  v-model="form.last_name"
                  type="text"
                  placeholder="Enter your last name"
                  :disabled="loading"
                  autocomplete="family-name"
                  required
                  @input="validateField('last_name')"
                  @blur="validateField('last_name')"
                />
              </FormControl>
              <FormError v-if="errors.last_name">{{ errors.last_name }}</FormError>
              <FormSuccess v-if="!errors.last_name && form.last_name.length > 0"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Email Field -->
            <FormField id="email" :error="errors.email" :state="getFieldState('email')">
              <FormLabel for="email">Email Address</FormLabel>
              <FormControl>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Enter your email"
                  :disabled="loading"
                  autocomplete="email"
                  required
                  @input="validateField('email')"
                  @blur="validateField('email')"
                />
              </FormControl>
              <FormError v-if="errors.email">{{ errors.email }}</FormError>
              <FormSuccess v-if="!errors.email && form.email.length > 0"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Password Field -->
            <FormField id="password" :error="errors.password" :state="getFieldState('password')">
              <FormLabel for="password">Password</FormLabel>
              <FormControl>
                <div class="password-input-wrapper">
                  <input
                    id="password"
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Create a strong password"
                    :disabled="loading"
                    autocomplete="new-password"
                    required
                    @input="validateField('password')"
                    @blur="validateField('password')"
                  />
                  <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                    <EyeOff v-if="showPassword" :size="18" />
                    <Eye v-else :size="18" />
                  </button>
                </div>
              </FormControl>
              <FormError v-if="errors.password">{{ errors.password }}</FormError>
              <FormHint>8+ characters, uppercase, lowercase, and number</FormHint>
              <FormSuccess v-if="!errors.password && form.password.length >= 8"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Confirm Password Field -->
            <FormField id="confirmPassword" :error="errors.confirmPassword" :state="getFieldState('confirmPassword')">
              <FormLabel for="confirmPassword">Confirm Password</FormLabel>
              <FormControl>
                <div class="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm your password"
                    :disabled="loading"
                    autocomplete="new-password"
                    required
                    @input="validateConfirmPassword"
                    @blur="validateField('confirmPassword')"
                  />
                  <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
                    <EyeOff v-if="showConfirmPassword" :size="18" />
                    <Eye v-else :size="18" />
                  </button>
                </div>
              </FormControl>
              <FormError v-if="errors.confirmPassword">{{ errors.confirmPassword }}</FormError>
              <FormSuccess v-if="!errors.confirmPassword && form.confirmPassword === form.password && form.confirmPassword.length > 0"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Username Field -->
            <FormField id="username" :error="errors.username" :state="getFieldState('username')">
              <FormLabel for="username">Username</FormLabel>
              <FormControl>
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  placeholder="Choose a username"
                  :disabled="loading"
                  autocomplete="username"
                  required
                  maxlength="12"
                  @input="handleUsernameInput"
                  @blur="validateField('username')"
                />
              </FormControl>
              <div class="form-field__hint-row">
                <FormError v-if="errors.username">{{ errors.username }}</FormError>
                <span class="char-count" :class="{ 'is-over': form.username.length > 12 }">{{ form.username.length }}/12</span>
              </div>
              <FormSuccess v-if="!errors.username && usernameAvailable === true && form.username.length > 0"><Check :size="16" class="success-icon" /> Available</FormSuccess>
              <FormError v-if="!errors.username && usernameAvailable === false && form.username.length > 0">Username taken</FormError>
              <p class="username-warning">Choose carefully — your username cannot be changed later</p>
            </FormField>

            <!-- Postcode Field -->
            <FormField id="postcode" :error="errors.postcode" :state="getFieldState('postcode')">
              <FormLabel for="postcode">Postcode</FormLabel>
              <FormControl>
                <input
                  id="postcode"
                  v-model="form.postcode"
                  type="text"
                  placeholder="UK Postcode (e.g. SW1A 1AA)"
                  :disabled="loading"
                  autocomplete="postal-code"
                  required
                  @input="validateField('postcode')"
                  @blur="validateField('postcode')"
                />
              </FormControl>
              <FormError v-if="errors.postcode">{{ errors.postcode }}</FormError>
              <FormSuccess v-if="!errors.postcode && form.postcode.length >= 4"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Role Field -->
            <FormField id="role" :error="errors.role" :state="getFieldState('role')">
              <FormLabel for="role">How will you use HireBeHired?</FormLabel>
              <FormControl>
                <select
                  id="role"
                  v-model="form.role"
                  class="form-select"
                  :disabled="loading"
                  required
                  @change="validateField('role')"
                  @blur="validateField('role')"
                >
                  <option value="" disabled>Select a role</option>
                  <option value="employer">Hire talent (Employer)</option>
                  <option value="worker">Find work (Worker)</option>
                </select>
              </FormControl>
              <FormError v-if="errors.role">{{ errors.role }}</FormError>
              <FormSuccess v-if="!errors.role && form.role"><Check :size="16" class="success-icon" /></FormSuccess>
            </FormField>

            <!-- Required Checkboxes -->
            <div class="checkbox-section">
              <FormField id="age_confirmation" :error="errors.age_confirmation" :state="getFieldState('age_confirmation')">
                <FormControl>
                  <label class="checkbox-label">
                    <input
                      id="age_confirmation"
                      v-model="form.age_confirmation"
                      type="checkbox"
                      :disabled="loading"
                      @change="validateField('age_confirmation')"
                    />
                    <span>I confirm I am 18+ and legally allowed to use this platform</span>
                  </label>
                </FormControl>
                <FormError v-if="errors.age_confirmation">{{ errors.age_confirmation }}</FormError>
              </FormField>

              <FormField id="terms_agreement" :error="errors.terms_agreement" :state="getFieldState('terms_agreement')">
                <FormControl>
                  <label class="checkbox-label">
                    <input
                      id="terms_agreement"
                      v-model="form.terms_agreement"
                      type="checkbox"
                      :disabled="loading"
                      @change="validateField('terms_agreement')"
                    />
                    <span>I agree to the Terms of Service and Privacy Policy</span>
                  </label>
                </FormControl>
                <FormError v-if="errors.terms_agreement">{{ errors.terms_agreement }}</FormError>
              </FormField>

              <FormField id="tax_responsibility" :error="errors.tax_responsibility" :state="getFieldState('tax_responsibility')">
                <FormControl>
                  <label class="checkbox-label">
                    <input
                      id="tax_responsibility"
                      v-model="form.tax_responsibility"
                      type="checkbox"
                      :disabled="loading"
                      @change="validateField('tax_responsibility')"
                    />
                    <span>I understand users are responsible for complying with UK laws and tax obligations</span>
                  </label>
                </FormControl>
                <FormError v-if="errors.tax_responsibility">{{ errors.tax_responsibility }}</FormError>
              </FormField>
            </div>

            <!-- Submit Button -->
            <button class="auth-form__submit" type="submit" :disabled="loading || !canSubmit">
              <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
              <span v-else>Sign up</span>
            </button>

            <!-- Submit Error -->
            <div v-if="submitError" role="alert" id="submit-error" class="submit-error">
              {{ submitError }}
            </div>

            <!-- Success Message -->
            <div v-if="success" role="status" class="success-message">
              Account created successfully. Please check your email to verify your account.
            </div>
          </form>
        </FormErrorBoundary>

        <footer class="auth-footer">
          <p>
            Already have an account?
            <a href="#" @click.prevent="handleSignInClick" class="auth-link">Sign in</a>
          </p>
        </footer>
      </div>
    </div>

    <ConfirmDialog
      :is-open="showConfirmDialog"
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave without creating your account?"
      confirm-text="Leave"
      cancel-text="Stay"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Check, Eye, EyeOff } from '@lucide/vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormSuccess from '~/components/primitives/form/FormSuccess.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';
import { useAuth } from '~/composables/useAuth';
import { useDirtyForm } from '~/composables/useDirtyForm';
import { validateSignUpForm, validateSignUp, SignUpFormSchema } from '~/schemas/auth';
import type { SignUpFormInput, SignUpInput } from '~/schemas/auth';

definePageMeta({
  layout: false,
  title: 'Sign Up - HireBeHired'
});

const router = useRouter();
const auth = useAuth();

// Form state
const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  username: '',
  first_name: '',
  last_name: '',
  postcode: '',
  role: '',
  age_confirmation: false,
  terms_agreement: false,
  tax_responsibility: false
}) as unknown as SignUpFormInput;

const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref('');
const success = ref(false);
const showConfirmDialog = ref(false);
const usernameAvailable = ref<boolean | null>(null);
const usernameCheckDebounce = ref<ReturnType<typeof setTimeout> | null>(null);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Username availability check
const handleUsernameInput = () => {
  errors.username = '';
  validateField('username');
  
  // Clear previous debounce
  if (usernameCheckDebounce.value) {
    clearTimeout(usernameCheckDebounce.value);
  }
  
  // Reset availability state
  usernameAvailable.value = null;
  
  // Only check if username is valid format
  if (form.username && /^[a-zA-Z0-9_-]+$/.test(form.username)) {
    usernameCheckDebounce.value = setTimeout(async () => {
      try {
        const response = await $fetch('/api/auth/check-username', {
          params: { username: form.username }
        });
        usernameAvailable.value = (response as any).available;
      } catch (error) {
        // Ignore errors, user will see error on submit
      }
    }, 300);
  }
};

// Use dirty form composable
const { isDirty, resetDirty } = useDirtyForm({
  formData: form as unknown as Record<string, any>,
  message: 'You have unsaved changes. Are you sure you want to leave without creating your account?',
  enableBeforeUnload: true
});

// Validation
const touchedFields = ref<Set<string>>(new Set());

const getFieldState = (fieldName: string): 'default' | 'success' | 'error' => {
  if (errors[fieldName]) return 'error';
  if (touchedFields.value.has(fieldName) && !errors[fieldName]) {
    const fieldValue = form[fieldName as keyof SignUpFormInput];
    if (fieldValue && String(fieldValue).length > 0) {
      // Special check for confirmPassword
      if (fieldName === 'confirmPassword') {
        return fieldValue === form.password ? 'success' : 'error';
      }
      return 'success';
    }
  }
  return 'default';
};

const validateField = (field: keyof SignUpFormInput) => {
  touchedFields.value.add(field as string);
  
  try {
    SignUpFormSchema.shape[field as keyof typeof SignUpFormSchema.shape].parse(form[field]);
    delete errors[field];
  } catch (error: any) {
    if (error.errors && error.errors[0]) {
      errors[field] = error.errors[0].message;
    } else {
      errors[field] = 'Invalid value';
    }
  }
};

const validateConfirmPassword = () => {
  touchedFields.value.add('confirmPassword');
  
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = "Passwords don't match";
  } else {
    delete errors.confirmPassword;
  }
};

const validateForm = () => {
  Object.keys(form).forEach(field => validateField(field as keyof SignUpFormInput));
  return Object.keys(errors).length === 0;
};

const isFormValid = computed(() => {
  return Object.values(form).every(value => {
    if (typeof value === 'boolean') return value === true;
    return value && value.trim() !== '';
  }) &&
         Object.keys(errors).length === 0;
});

const canSubmit = computed(() => {
  return Object.keys(errors).length === 0 &&
         Object.values(form).every(value => {
           if (typeof value === 'boolean') return value === true;
           return value && value.trim() !== '';
         });
});

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  submitError.value = '';
  success.value = false;

  try {
    // Validate form with confirmPassword
    const formValidation = validateSignUpForm(form);
    if (!formValidation.success) {
      // Map Zod errors to form errors
      Object.entries(formValidation.errors || {}).forEach(([field, message]) => {
        errors[field] = message;
      });
      return;
    }

    const apiData: SignUpInput = {
      email: form.email,
      password: form.password,
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      postcode: form.postcode,
      role: form.role
    };

    await auth.signup(apiData);
    success.value = true;
    resetDirty();

    // Redirect after success
    setTimeout(() => {
      router.push('/auth/sign-in?message=Please check your email to verify your account');
    }, 2000);

  } catch (error: any) {
    submitError.value = error?.data?.statusMessage || 'Failed to create account. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Error boundary handlers
const handleError = (error: unknown) => {
  if (import.meta.dev) {
    console.error('Form error:', error);
  }
};

const handleFormError = (error: Error) => {
  handleError(error);
};

const handleFormReset = () => {
  // Reset form data when error boundary reset is triggered
  Object.assign(form, {
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    postcode: '',
    role: '',
    age_confirmation: false,
    terms_agreement: false,
    tax_responsibility: false
  });
  Object.keys(errors).forEach(key => delete errors[key]);
  submitError.value = '';
  success.value = false;
  resetDirty();
};

const handleSignInClick = () => {
  if (isDirty as any) {
    showConfirmDialog.value = true;
  } else {
    router.push('/auth/sign-in');
  }
};

const handleDialogConfirm = () => {
  showConfirmDialog.value = false;
  router.push('/auth/sign-in');
};

const handleDialogCancel = () => {
  showConfirmDialog.value = false;
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
  padding: var(--space-4);
}

.auth-container {
  width: 100%;
  max-width: 480px;
}

.auth-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-8);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-8);
}

.auth-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.auth-subtitle {
  color: var(--color-gray-600);
  font-size: var(--text-base);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.form-select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: white;
  transition: border-color 150ms var(--ease-out);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.form-select.error {
  border-color: var(--color-error-500);
}

.username-warning {
  margin: var(--space-1) 0 0 0;
  font-size: var(--text-xs);
  color: var(--color-warning-700);
  background: var(--color-warning-100);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.auth-form__submit {
  border: none;
  border-radius: var(--radius-lg);
  background: var(--color-primary-600);
  color: white;
  padding: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.submit-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-200);
  font-size: var(--text-sm);
}

.success-message {
  background: var(--color-success-50);
  color: var(--color-success-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-success-200);
  font-size: var(--text-sm);
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-gray-200);
}

.auth-link {
  color: var(--color-primary-600);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: color 150ms var(--ease-out);
}

.auth-link:hover {
  color: var(--color-primary-700);
  text-decoration: underline;
}

.form-field__hint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.char-count {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.char-count.is-over {
  color: var(--color-error-500);
}

.checkbox-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
  font-size: var(--text-sm);
  line-height: 1.5;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 40px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.password-toggle:hover {
  opacity: 0.7;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  color: var(--color-success-600);
}

@media (prefers-reduced-motion: reduce) {
  .auth-container {
  }

  .auth-form__submit {
    transition: none;
  }

  .auth-form__submit.is-loading {
  }

  .auth-form__success-icon {
  }
}
</style>
