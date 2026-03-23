<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <header class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join ChoreShore to find work or hire talent</p>
        </header>

        <FormErrorBoundary 
          form-name="sign-up-form"
          @form-error="handleFormError"
          @reset="handleFormReset"
        >
          <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
            <!-- Email Field -->
            <FormField id="email" :error="errors.email" :state="errors.email ? 'error' : 'default'">
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
                  @blur="validateField('email')"
                />
              </FormControl>
              <FormError v-if="errors.email">{{ errors.email }}</FormError>
            </FormField>

            <!-- Password Field -->
            <FormField id="password" :error="errors.password" :state="errors.password ? 'error' : 'default'">
              <FormLabel for="password">Password</FormLabel>
              <FormControl>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  placeholder="Create a strong password"
                  :disabled="loading"
                  autocomplete="new-password"
                  required
                  @blur="validateField('password')"
                />
              </FormControl>
             
              <FormError v-if="errors.password">{{ errors.password }}</FormError>
            </FormField>

            <!-- Confirm Password Field -->
            <FormField id="confirmPassword" :error="errors.confirmPassword" :state="errors.confirmPassword ? 'error' : 'default'">
              <FormLabel for="confirmPassword">Confirm Password</FormLabel>
              <FormControl>
                <input
                  id="confirmPassword"
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  :disabled="loading"
                  autocomplete="new-password"
                  required
                  @blur="validateField('confirmPassword')"
                />
              </FormControl>
              <FormError v-if="errors.confirmPassword">{{ errors.confirmPassword }}</FormError>
            </FormField>

            <!-- First Name Field -->
            <FormField id="first_name" :error="errors.first_name" :state="errors.first_name ? 'error' : 'default'">
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
                  @blur="validateField('first_name')"
                />
              </FormControl>
              <FormError v-if="errors.first_name">{{ errors.first_name }}</FormError>
            </FormField>

            <!-- Last Name Field -->
            <FormField id="last_name" :error="errors.last_name" :state="errors.last_name ? 'error' : 'default'">
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
                  @blur="validateField('last_name')"
                />
              </FormControl>
              <FormError v-if="errors.last_name">{{ errors.last_name }}</FormError>
            </FormField>

            <!-- Role Selection -->
            <FormField id="role" :error="errors.role" :state="errors.role ? 'error' : 'default'">
              <FormLabel for="role">I want to</FormLabel>
              <FormControl>
                <select
                  id="role"
                  v-model="form.role"
                  class="form-select"
                  :disabled="loading"
                  required
                  @change="validateField('role')"
                >
                  <option value="">Select your role</option>
                  <option value="worker">Find work opportunities</option>
                  <option value="employer">Hire talented workers</option>
                </select>
              </FormControl>
              <FormError v-if="errors.role">{{ errors.role }}</FormError>
            </FormField>

            <!-- Submit Button -->
            <button class="auth-form__submit" type="submit" :disabled="loading || !canSubmit">
              <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
              <span v-else>Create Account</span>
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
        </FormErrorBoundary>

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
import FormError from '~/components/primitives/form/FormError.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import { useAuth } from '~/composables/useAuth';
import { validateSignUpForm, validateSignUp } from '~/schemas/auth';
import type { SignUpFormInput, SignUpInput } from '~/schemas/auth';

definePageMeta({
  layout: false,
  title: 'Sign Up - ChoreShore'
});

const router = useRouter();
const auth = useAuth();

// Form state
const form = reactive<SignUpFormInput>({
  email: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: '',
  role: ''
});

const errors = reactive<Record<string, string>>({});
const loading = ref(false);
const submitError = ref('');
const success = ref(false);

// Validation
const validateField = (field: keyof SignUpFormInput) => {
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

  if (field === 'first_name' || field === 'last_name') {
    if ((fieldValue as string).length < 2) {
      errors[field] = `${field === 'first_name' ? 'First' : 'Last'} name must be at least 2 characters`;
    }
  }

  if (field === 'role') {
    if (!fieldValue || !['worker', 'employer'].includes(fieldValue as string)) {
      errors[field] = 'Please select a role';
    }
  }
};

const validateForm = () => {
  Object.keys(form).forEach(field => validateField(field as keyof SignUpFormInput));
  return Object.keys(errors).length === 0;
};

const isFormValid = computed(() => {
  return Object.values(form).every(value => value.trim() !== '') && 
         Object.keys(errors).length === 0;
});

const canSubmit = computed(() => {
  return Object.keys(errors).length === 0 && 
         Object.values(form).every(value => value && value.trim() !== '');
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

    // Prepare data for API (remove confirmPassword and ensure role is valid)
    if (!form.role || !['employer', 'worker'].includes(form.role)) {
      errors.role = 'Please select a role';
      return;
    }

    const apiData: SignUpInput = {
      email: form.email,
      password: form.password,
      first_name: form.first_name,
      last_name: form.last_name,
      role: form.role, // Now safe since we validated it's 'employer' | 'worker'
      phone: form.phone
    };

    await auth.signup(apiData);
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

// Error boundary handlers
const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
  // You could also send this to your error monitoring service
};

const handleFormReset = () => {
  // Reset form data when error boundary reset is triggered
  Object.assign(form, {
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: ''
  });
  Object.keys(errors).forEach(key => delete errors[key]);
  submitError.value = '';
  success.value = false;
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
