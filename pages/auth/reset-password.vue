<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Reset Password</h1>
          <p class="auth-subtitle">Enter your email to receive a password reset link</p>
        </header>

        <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
          <!-- Email Field -->
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

          <!-- Submit Button -->
          <button
            type="submit"
            class="auth-submit"
            :disabled="loading || !isFormValid"
            :aria-describedby="submitError ? 'submit-error' : undefined"
          >
            <span v-if="loading" class="loading-spinner" aria-hidden="true"></span>
            <span>{{ loading ? 'Sending Reset Link...' : 'Send Reset Link' }}</span>
          </button>

          <!-- Submit Error -->
          <div v-if="submitError" role="alert" id="submit-error" class="submit-error">
            {{ submitError }}
          </div>

          <!-- Success Message -->
          <div v-if="success" role="status" class="success-message">
            <div class="success-icon" aria-hidden="true">✓</div>
            <div>
              <p class="success-title">Reset link sent!</p>
              <p class="success-text">
                Check your email for a password reset link. It may take a few minutes to arrive.
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
import { ref, computed, reactive } from 'vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import { validatePasswordReset } from '~/schemas/auth';
import type { PasswordResetInput } from '~/schemas/auth';

definePageMeta({
  layout: false,
  title: 'Reset Password - ChoreShore'
});

// Form state
const form = reactive<PasswordResetInput>({
  email: ''
});

const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref('');
const success = ref(false);

// Validation
const validateField = (field: keyof PasswordResetInput) => {
  const fieldValue = form[field];
  
  // Clear previous error
  delete errors[field];

  // Basic validation
  if (!fieldValue) {
    errors[field] = 'Email is required';
    return;
  }

  // Email validation
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

const isFormValid = computed(() => {
  return form.email.trim() !== '' && Object.keys(errors).length === 0;
});

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  submitError.value = '';
  success.value = false;

  try {
    // Validate with Zod schema
    const validation = validatePasswordReset(form);
    if (!validation.success) {
      // Map Zod errors to form errors
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
  animation: slideUp 400ms var(--ease-out);
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

.auth-submit {
  width: 100%;
  padding: var(--space-4);
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: all 200ms var(--ease-out);
}

.auth-submit:hover:not(:disabled) {
  background: var(--color-primary-700);
  transform: translateY(-1px);
}

.auth-submit:active {
  transform: translateY(0) scale(0.98);
  transition: transform 50ms var(--ease-in);
}

.auth-submit:disabled {
  background: var(--color-gray-400);
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.submit-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-200);
  font-size: var(--text-sm);
  animation: shake 400ms var(--ease-out);
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
  animation: slideUp 300ms var(--ease-out);
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
  animation: celebrate 500ms var(--ease-out);
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

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

@keyframes celebrate {
  0% { transform: scale(1); }
  25% { transform: scale(1.2) rotate(-5deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  75% { transform: scale(1.05) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}

@media (prefers-reduced-motion: reduce) {
  .auth-card,
  .success-message,
  .submit-error,
  .success-icon {
    animation: none;
  }
  
  .auth-submit {
    transition: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}
</style>
