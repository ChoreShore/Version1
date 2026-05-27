<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Reset Password</h1>
          <p v-if="!isRecovery" class="auth-subtitle">Enter your email to receive a password reset link</p>
          <p v-else class="auth-subtitle">Enter your new password below</p>
        </header>

        <!-- Request reset link form -->
        <form v-if="!isRecovery" @submit.prevent="handleRequestSubmit" class="auth-form" novalidate>
          <FormField id="email" :error="errors.email" :state="errors.email ? 'error' : 'default'">
            <FormLabel for="email">Email Address</FormLabel>
            <FormControl>
              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="Enter your email address"
                :disabled="loading"
                autocomplete="email"
                required
                @blur="validateField('email')"
              />
            </FormControl>
            <FormHint>We'll send you a secure link to reset your password</FormHint>
            <FormError v-if="errors.email">{{ errors.email }}</FormError>
          </FormField>

          <button class="auth-form__submit" type="submit" :disabled="loading || !canSubmit">
            <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
            <span v-else>Send Reset Link</span>
          </button>

          <div v-if="submitError" role="alert" id="submit-error" class="submit-error">
            {{ submitError }}
          </div>

          <div v-if="success" role="status" class="success-message">
            <div class="success-icon" aria-hidden="true">✓</div>
            <div>
              <p class="success-title">Reset link sent</p>
              <p class="success-text">
                Check your email for a password reset link. It may take a few minutes to arrive.
              </p>
            </div>
          </div>
        </form>

        <!-- Update password form (recovery mode) -->
        <form v-else @submit.prevent="handleUpdateSubmit" class="auth-form" novalidate>
          <FormField id="newPassword" :error="errors.newPassword" :state="errors.newPassword ? 'error' : 'default'">
            <FormLabel for="newPassword">New Password</FormLabel>
            <FormControl>
              <input
                id="newPassword"
                v-model="updateForm.newPassword"
                type="password"
                placeholder="Enter your new password"
                :disabled="loading"
                autocomplete="new-password"
                required
                @blur="validateUpdateField('newPassword')"
              />
            </FormControl>
            <FormHint>Must be at least 8 characters with uppercase, lowercase, and a number</FormHint>
            <FormError v-if="errors.newPassword">{{ errors.newPassword }}</FormError>
          </FormField>

          <FormField id="confirmPassword" :error="errors.confirmPassword" :state="errors.confirmPassword ? 'error' : 'default'">
            <FormLabel for="confirmPassword">Confirm Password</FormLabel>
            <FormControl>
              <input
                id="confirmPassword"
                v-model="updateForm.confirmPassword"
                type="password"
                placeholder="Confirm your new password"
                :disabled="loading"
                autocomplete="new-password"
                required
                @blur="validateUpdateField('confirmPassword')"
              />
            </FormControl>
            <FormError v-if="errors.confirmPassword">{{ errors.confirmPassword }}</FormError>
          </FormField>

          <button class="auth-form__submit" type="submit" :disabled="loading || !canUpdateSubmit">
            <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
            <span v-else>Update Password</span>
          </button>

          <div v-if="submitError" role="alert" id="submit-error" class="submit-error">
            {{ submitError }}
          </div>

          <div v-if="success" role="status" class="success-message">
            <div class="success-icon" aria-hidden="true">✓</div>
            <div>
              <p class="success-title">Password updated</p>
              <p class="success-text">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
            </div>
          </div>
        </form>

        <footer class="auth-footer">
          <p>
            Remember your password?
            <NuxtLink to="/auth/sign-in" class="auth-link">Sign in</NuxtLink>
          </p>
          <p>
            Don't have an account?
            <NuxtLink to="/auth/sign-up" class="auth-link">Sign up</NuxtLink>
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import { validatePasswordReset, validateRecoveryUpdatePassword } from '~/schemas/auth';
import type { PasswordResetInput, RecoveryUpdatePasswordInput } from '~/schemas/auth';

definePageMeta({
  layout: false,
  title: 'Reset Password - HireBeHired'
});

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const router = useRouter();

// Detect recovery mode based on active session (Supabase sets session after email link click)
const isRecovery = ref(false);

watch(user, (newUser) => {
  isRecovery.value = !!newUser;
}, { immediate: true });

// ─── Request Link Form ──────────────────────────────────────────────────────

const form = reactive<PasswordResetInput>({
  email: ''
});

const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref('');
const success = ref(false);

const validateField = (field: keyof PasswordResetInput) => {
  const fieldValue = form[field];
  delete errors[field];
  if (!fieldValue) {
    errors[field] = 'Email is required';
    return;
  }
  if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fieldValue as string)) {
      errors[field] = 'Please enter a valid email address';
    }
  }
};

const validateForm = () => {
  Object.keys(form).forEach(field => validateField(field as keyof PasswordResetInput));
  return Object.keys(errors).length === 0;
};

const canSubmit = computed(() => {
  return Object.keys(errors).length === 0 &&
         form.email && form.email.trim() !== '';
});

const handleRequestSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  submitError.value = '';
  success.value = false;

  try {
    const validation = validatePasswordReset(form);
    if (!validation.success) {
      Object.entries(validation.errors || {}).forEach(([field, message]) => {
        errors[field] = message;
      });
      return;
    }

    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: validation.data
    });

    success.value = true;
  } catch (error: any) {
    submitError.value = error?.data?.statusMessage || 'Failed to send reset link. Please try again.';
  } finally {
    loading.value = false;
  }
};

// ─── Update Password Form (Recovery) ──────────────────────────────────────

const updateForm = reactive<RecoveryUpdatePasswordInput>({
  newPassword: '',
  confirmPassword: ''
});

const validateUpdateField = (field: keyof RecoveryUpdatePasswordInput) => {
  const fieldValue = updateForm[field];
  delete errors[field];
  if (!fieldValue) {
    errors[field] = field === 'newPassword' ? 'Password is required' : 'Please confirm your password';
    return;
  }
  if (field === 'newPassword') {
    if (fieldValue.length < 8) errors[field] = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(fieldValue)) errors[field] = 'Password must contain at least one uppercase letter';
    else if (!/[a-z]/.test(fieldValue)) errors[field] = 'Password must contain at least one lowercase letter';
    else if (!/[0-9]/.test(fieldValue)) errors[field] = 'Password must contain at least one number';
  }
  if (field === 'confirmPassword' && updateForm.newPassword !== fieldValue) {
    errors[field] = "Passwords don't match";
  }
};

const validateUpdateForm = () => {
  (['newPassword', 'confirmPassword'] as const).forEach(field => validateUpdateField(field));
  return Object.keys(errors).length === 0;
};

const canUpdateSubmit = computed(() => {
  return updateForm.newPassword && updateForm.confirmPassword && Object.keys(errors).length === 0;
});

const handleUpdateSubmit = async () => {
  if (!validateUpdateForm()) return;

  loading.value = true;
  submitError.value = '';
  success.value = false;

  try {
    const validation = validateRecoveryUpdatePassword(updateForm);
    if (!validation.success || !validation.data) {
      Object.entries(validation.errors || {}).forEach(([field, message]) => {
        errors[field] = message;
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: validation.data.newPassword
    });

    if (error) throw error;

    success.value = true;
    await supabase.auth.signOut();
    setTimeout(() => router.push('/auth/sign-in'), 3000);
  } catch (error: any) {
    submitError.value = error?.message || 'Failed to update password. Please try again.';
  } finally {
    loading.value = false;
  }
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
  max-width: 420px;
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
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-success-200);
  font-size: var(--text-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.success-icon {
  width: 20px;
  height: 20px;
  background: var(--color-success-600);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  flex-shrink: 0;
}

.success-title {
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-1);
}

.success-text {
  font-size: var(--text-sm);
  opacity: 0.9;
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-gray-200);
}

.auth-footer p {
  margin-bottom: var(--space-2);
}

.auth-footer p:last-child {
  margin-bottom: 0;
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

@media (prefers-reduced-motion: reduce) {
  .auth-form__submit {
    transition: none;
  }
}
</style>
