<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join ChoreShore to find work or hire talent</p>
        </header>

        <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
          <!-- Email Field -->
          <FormField>
            <FormLabel for="email" required>Email Address</FormLabel>
            <FormControl
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Enter your email"
              :error="errors.email"
              :disabled="loading"
              autocomplete="email"
              aria-describedby="email-error"
              @blur="validateField('email')"
            />
            <FormHint v-if="errors.email" id="email-error" type="error">
              {{ errors.email }}
            </FormHint>
          </FormField>

          <!-- Password Field -->
          <FormField>
            <FormLabel for="password" required>Password</FormLabel>
            <FormControl
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Create a strong password"
              :error="errors.password"
              :disabled="loading"
              autocomplete="new-password"
              aria-describedby="password-error password-hint"
              @blur="validateField('password')"
            />
            <FormHint id="password-hint">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </FormHint>
            <FormHint v-if="errors.password" id="password-error" type="error">
              {{ errors.password }}
            </FormHint>
          </FormField>

          <!-- Confirm Password Field -->
          <FormField>
            <FormLabel for="confirmPassword" required>Confirm Password</FormLabel>
            <FormControl
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              :error="errors.confirmPassword"
              :disabled="loading"
              autocomplete="new-password"
              aria-describedby="confirm-password-error"
              @blur="validateField('confirmPassword')"
            />
            <FormHint v-if="errors.confirmPassword" id="confirm-password-error" type="error">
              {{ errors.confirmPassword }}
            </FormHint>
          </FormField>

          <!-- First Name Field -->
          <FormField>
            <FormLabel for="firstName" required>First Name</FormLabel>
            <FormControl
              id="firstName"
              v-model="form.firstName"
              type="text"
              placeholder="Enter your first name"
              :error="errors.firstName"
              :disabled="loading"
              autocomplete="given-name"
              aria-describedby="first-name-error"
              @blur="validateField('firstName')"
            />
            <FormHint v-if="errors.firstName" id="first-name-error" type="error">
              {{ errors.firstName }}
            </FormHint>
          </FormField>

          <!-- Last Name Field -->
          <FormField>
            <FormLabel for="lastName" required>Last Name</FormLabel>
            <FormControl
              id="lastName"
              v-model="form.lastName"
              type="text"
              placeholder="Enter your last name"
              :error="errors.lastName"
              :disabled="loading"
              autocomplete="family-name"
              aria-describedby="last-name-error"
              @blur="validateField('lastName')"
            />
            <FormHint v-if="errors.lastName" id="last-name-error" type="error">
              {{ errors.lastName }}
            </FormHint>
          </FormField>

          <!-- Role Selection -->
          <FormField>
            <FormLabel for="role" required>I want to</FormLabel>
            <select
              id="role"
              v-model="form.role"
              class="form-select"
              :class="{ 'error': errors.role }"
              :disabled="loading"
              aria-describedby="role-error"
              @change="validateField('role')"
            >
              <option value="">Select your role</option>
              <option value="worker">Find work opportunities</option>
              <option value="employer">Hire talented workers</option>
            </select>
            <FormHint v-if="errors.role" id="role-error" type="error">
              {{ errors.role }}
            </FormHint>
          </FormField>

          <!-- Submit Button -->
          <button
            type="submit"
            class="auth-submit"
            :disabled="loading || !isFormValid"
            :aria-describedby="submitError ? 'submit-error' : undefined"
          >
            <span v-if="loading" class="loading-spinner" aria-hidden="true"></span>
            <span>{{ loading ? 'Creating Account...' : 'Create Account' }}</span>
          </button>

          <!-- Submit Error -->
          <div v-if="submitError" role="alert" id="submit-error" class="submit-error">
            {{ submitError }}
          </div>

          <!-- Success Message -->
          <div v-if="success" role="status" class="success-message">
            Account created successfully! Please check your email to verify your account.
          </div>
        </form>

        <footer class="auth-footer">
          <p>
            Already have an account?
            <NuxtLink to="/auth/sign-in" class="auth-link">Sign in</NuxtLink>
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import { useAuth } from '~/composables/useAuth';
import { validateSignUp } from '~/schemas/auth';
import type { SignUpInput } from '~/schemas/auth';

definePageMeta({
  layout: false,
  title: 'Sign Up - ChoreShore'
});

const router = useRouter();
const auth = useAuth();

// Form state
const form = reactive<SignUpInput>({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: ''
});

const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref('');
const success = ref(false);

// Validation
const validateField = (field: keyof SignUpInput) => {
  const fieldValue = form[field];
  
  // Clear previous error
  delete errors[field];

  // Basic validation
  if (!fieldValue) {
    errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    return;
  }

  // Specific validations
  if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fieldValue as string)) {
      errors[field] = 'Please enter a valid email address';
    }
  }

  if (field === 'password') {
    const password = fieldValue as string;
    if (password.length < 8) {
      errors[field] = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      errors[field] = 'Password must contain uppercase, lowercase, number, and special character';
    }
  }

  if (field === 'confirmPassword') {
    if (fieldValue !== form.password) {
      errors[field] = 'Passwords do not match';
    }
  }

  if (field === 'firstName' || field === 'lastName') {
    if ((fieldValue as string).length < 2) {
      errors[field] = `${field === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
    }
  }

  if (field === 'role') {
    if (!['worker', 'employer'].includes(fieldValue as string)) {
      errors[field] = 'Please select a valid role';
    }
  }
};

const validateForm = () => {
  Object.keys(form).forEach(field => validateField(field as keyof SignUpInput));
  return Object.keys(errors).length === 0;
};

const isFormValid = computed(() => {
  return Object.values(form).every(value => value.trim() !== '') && 
         Object.keys(errors).length === 0;
});

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  submitError.value = '';
  success.value = false;

  try {
    // Validate with Zod schema
    const validation = validateSignUp(form);
    if (!validation.success) {
      // Map Zod errors to form errors
      Object.entries(validation.errors || {}).forEach(([field, message]) => {
        errors[field] = message;
      });
      return;
    }

    await auth.signup(validation.data);
    success.value = true;
    
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
  transform: translateY(0);
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
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-success-200);
  font-size: var(--text-sm);
  animation: slideUp 300ms var(--ease-out);
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

@media (prefers-reduced-motion: reduce) {
  .auth-card,
  .success-message,
  .submit-error {
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
