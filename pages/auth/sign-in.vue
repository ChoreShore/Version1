<template>
  <div class="auth-shell">
    <section class="auth-card">
      <header class="auth-card__header">
        <p class="auth-card__eyebrow">Welcome back</p>
        <h1>Sign in to ChoreShore</h1>
        <p class="auth-card__description">Continue managing jobs, applications, and conversations.</p>
      </header>

      <form class="auth-form" @submit.prevent="handleSignIn" novalidate>
        <FormField id="email" :error="errors.email" :state="emailState">
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
            />
          </FormControl>
          <FormError v-if="emailState === 'error'">Enter a valid email address.</FormError>
        </FormField>

        <FormField id="password" :error="errors.password" :state="passwordState">
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
            />
          </FormControl>
          <FormError v-if="passwordState === 'error'">Password must be at least 8 characters.</FormError>
          <FormHint>Forgot your password? Contact support.</FormHint>
        </FormField>

        <button class="auth-form__submit" type="submit" :disabled="loading || !canSubmit">
          <LoadingSkeleton v-if="loading" variant="text" width="100%" height="16px" />
          <span v-else>Sign in</span>
        </button>
      </form>

      <p v-if="errorMessage" class="auth-card__error" role="alert">{{ errorMessage }}</p>
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
import { useSupabaseClient, useSupabaseUser } from '#imports';
import { validateSignIn } from '~/schemas/auth';
import type { SignInInput } from '~/schemas/auth';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const errors = ref<Record<string, string>>({});

const emailState = computed(() => {
  if (!email.value) return undefined;
  return email.value.includes('@') ? undefined : 'error';
});

const passwordState = computed(() => {
  if (!password.value) return undefined;
  return password.value.length >= 8 ? undefined : 'error';
});

const canSubmit = computed(() => !emailState.value && !passwordState.value && email.value && password.value);

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
</script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  background: var(--color-surface-2, #f5f7fb);
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
  color: var(--color-text-subtle);
  margin-bottom: 8px;
}

.auth-card__description {
  margin: 8px 0 0;
  color: var(--color-text-muted);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-form input {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
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

.auth-card__error {
  margin: 0;
  color: var(--color-danger, #b42318);
}

.auth-visual {
  background: linear-gradient(180deg, var(--color-primary-700), var(--color-primary-500));
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

@media (max-width: 768px) {
  .auth-card {
    padding: var(--space-6);
  }

  .auth-visual {
    display: none;
  }
}
</style>
