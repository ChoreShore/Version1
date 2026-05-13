<template>
  <div class="auth-shell">
    <section class="auth-card">
      <header class="auth-card__header">
        <p class="auth-card__eyebrow">Welcome back</p>
        <h1>Sign in to ChoreShore</h1>
        <p class="auth-card__description">Continue managing jobs, applications, and conversations.</p>
      </header>

      <FormErrorBoundary 
        form-name="sign-in-form"
        @form-error="handleFormError"
        @reset="handleFormReset"
      >
        <form class="auth-form" @submit.prevent="handleSignIn" novalidate>
          <FormField id="email" :error="errors.email" :state="getFieldState('email')">
            <FormLabel for="email">Email</FormLabel>
            <FormControl>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                :disabled="loading"
                required
                @input="validateField('email')"
                @blur="validateField('email')"
              />
            </FormControl>
            <FormError v-if="errors.email">{{ errors.email }}</FormError>
            <FormSuccess v-if="!errors.email && email.length > 0">✓</FormSuccess>
          </FormField>

          <FormField id="password" :error="errors.password" :state="getFieldState('password')">
            <FormLabel for="password">Password</FormLabel>
            <FormControl>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="loading"
                required
                @input="validateField('password')"
                @blur="validateField('password')"
              />
            </FormControl>
            <FormError v-if="errors.password">{{ errors.password }}</FormError>
            <FormHint>
              <NuxtLink to="/auth/reset-password" class="auth-link">Forgot your password?</NuxtLink>
            </FormHint>
            <FormSuccess v-if="!errors.password && password.length >= 8">✓</FormSuccess>
          </FormField>

          <button class="auth-form__submit" type="submit" :disabled="loading || !canSubmit">
            <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
            <span v-else>Sign in</span>
          </button>
        </form>
      </FormErrorBoundary>

      <p v-if="errorMessage" class="auth-card__error" role="alert">{{ errorMessage }}</p>

      <footer class="auth-footer">
        <p>
          Don't have an account?
          <NuxtLink to="/auth/sign-up" class="auth-link">Sign up</NuxtLink>
        </p>
      </footer>
    </section>
    <div class="auth-visual">
      <h2>Built for busy teams</h2>
      <p>Track your jobs, review applications, message hires, and collect reviews—all in one clean workspace.</p>
      <ul>
        <li>Role aware dashboards</li>
        <li>Realtime messaging</li>
        <li>Rich application insights</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

definePageMeta({
  layout: false,
  title: 'Sign In - ChoreShore'
});
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { validateSignIn, SignInSchema } from '~/schemas/auth';
import type { SignInInput } from '~/schemas/auth';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormSuccess from '~/components/primitives/form/FormSuccess.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const errors = ref<Record<string, string>>({});

const touchedFields = ref<Set<string>>(new Set());

const getFieldState = (fieldName: string): 'default' | 'success' | 'error' => {
  if (errors.value[fieldName]) return 'error';
  if (touchedFields.value.has(fieldName) && !errors.value[fieldName]) {
    const fieldValue = fieldName === 'email' ? email.value : password.value;
    if (fieldValue && String(fieldValue).length > 0) return 'success';
  }
  return 'default';
};

const validateField = (fieldName: 'email' | 'password') => {
  touchedFields.value.add(fieldName);
  
  try {
    const schema = fieldName === 'email' ? SignInSchema.shape.email : SignInSchema.shape.password;
    const value = fieldName === 'email' ? email.value : password.value;
    schema.parse(value);
    delete errors.value[fieldName];
  } catch (error: any) {
    if (error.errors && error.errors[0]) {
      errors.value[fieldName] = error.errors[0].message;
    } else {
      errors.value[fieldName] = 'Invalid value';
    }
  }
};

const canSubmit = computed(() => {
  return !errors.value.email && !errors.value.password && email.value && password.value && password.value.length >= 8;
});

const handleSignIn = async () => {
  // Validate form with Zod
  const formData: SignInInput = {
    email: email.value,
    password: password.value
  };
  
  const validation = validateSignIn(formData);
  if (!validation.success) {
    errors.value = validation.errors || {};
    return;
  }
  
  if (!canSubmit.value || loading.value) return;

  loading.value = true;
  errorMessage.value = '';
  errors.value = {};

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error.message || 'Unable to sign you in. Please try again.';
    return;
  }

  if (user.value) {
    navigateTo('/dashboard');
  } else {
    await supabase.auth.getSession();
    navigateTo('/dashboard');
  }
};

// Error boundary handlers
const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
  // You could also send this to your error monitoring service
};

const handleFormReset = () => {
  // Reset form data when error boundary reset is triggered
  email.value = '';
  password.value = '';
  errorMessage.value = '';
  errors.value = {};
};
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr;
  background: var(--bg);
}

@media (min-width: 768px) {
  .auth-shell {
    grid-template-columns: 1fr 1fr;
  }
}

.auth-card {
  padding: var(--space-8);
  max-width: 520px;
  width: 100%;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.auth-card__header h1 {
  margin: 0;
}

.auth-card__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--muted);
  margin-bottom: 8px;
}

.auth-card__description {
  margin: 8px 0 0;
  color: var(--muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
}

.auth-form__submit {
  border: none;
  border-radius: var(--radius-lg);
  background: var(--teal);
  color: white;
  padding: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  transition: background 150ms ease;
}

.auth-form__submit:hover {
  background: var(--success);
}

.auth-card__error {
  margin: 0;
  color: var(--color-danger, #b42318);
}

.auth-visual {
  background: linear-gradient(180deg, var(--teal), var(--success));
  color: white;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  justify-content: center;
}

.auth-visual h2 {
  margin: 0;
}

.auth-visual ul {
  margin: 0;
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.auth-footer {
  text-align: center;
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border);
}

.auth-link {
  color: var(--teal);
  text-decoration: none;
  font-weight: 600;
  transition: color 150ms ease-out;
}

.auth-link:hover {
  color: var(--accent);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .auth-card {
    padding: var(--space-6);
  }

  .auth-visual {
    display: none;
  }
}
</style>
