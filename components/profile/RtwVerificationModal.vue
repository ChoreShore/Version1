<template>
  <div class="rtw-overlay" role="dialog" aria-modal="true" aria-labelledby="rtw-title">
    <div class="rtw-modal">
      <header class="rtw-modal__header">
        <button class="rtw-modal__close" type="button" aria-label="Close" @click="emit('close')">&#x2715;</button>
        <div class="rtw-modal__icon">🪪</div>
        <h2 id="rtw-title" class="rtw-modal__title">Verify your right to work</h2>
        <p class="rtw-modal__subtitle">
          Before you can apply to jobs on ChoreShore, you need to verify your UK right to work using your Home Office share code.
        </p>
      </header>

      <div v-if="state === 'success'" class="rtw-modal__success">
        <p class="rtw-modal__success-icon">✅</p>
        <h3>Verification successful</h3>
        <p>Welcome, {{ verifiedName }}. Your right to work has been confirmed{{ expiryDisplay ? ` and is valid until ${expiryDisplay}` : '' }}.</p>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="rtw-modal__form" novalidate>
        <div class="rtw-modal__field">
          <label for="rtw-code">Share code</label>
          <input
            id="rtw-code"
            v-model="form.code"
            type="text"
            placeholder="e.g. W1234-5678"
            autocomplete="off"
            :class="{ 'is-error': errors.code }"
            :disabled="state === 'loading'"
          />
          <p v-if="errors.code" class="rtw-modal__field-error">{{ errors.code }}</p>
          <p class="rtw-modal__field-hint">Your share code starts with 'W' — get it from <a href="https://www.gov.uk/prove-right-to-work" target="_blank" rel="noopener">gov.uk</a></p>
        </div>

        <div class="rtw-modal__field">
          <label for="rtw-dob">Date of birth</label>
          <input
            id="rtw-dob"
            v-model="form.dob"
            type="text"
            placeholder="dd-mm-yyyy"
            autocomplete="bday"
            :class="{ 'is-error': errors.dob }"
            :disabled="state === 'loading'"
          />
          <p v-if="errors.dob" class="rtw-modal__field-error">{{ errors.dob }}</p>
        </div>

        <div class="rtw-modal__row">
          <div class="rtw-modal__field">
            <label for="rtw-forename">First name</label>
            <input
              id="rtw-forename"
              v-model="form.forename"
              type="text"
              placeholder="First name"
              autocomplete="given-name"
              :class="{ 'is-error': errors.forename }"
              :disabled="state === 'loading'"
            />
            <p v-if="errors.forename" class="rtw-modal__field-error">{{ errors.forename }}</p>
          </div>

          <div class="rtw-modal__field">
            <label for="rtw-surname">Last name</label>
            <input
              id="rtw-surname"
              v-model="form.surname"
              type="text"
              placeholder="Last name"
              autocomplete="family-name"
              :class="{ 'is-error': errors.surname }"
              :disabled="state === 'loading'"
            />
            <p v-if="errors.surname" class="rtw-modal__field-error">{{ errors.surname }}</p>
          </div>
        </div>

        <p v-if="apiError" class="rtw-modal__api-error">{{ apiError }}</p>

        <button
          type="submit"
          class="rtw-modal__submit"
          :disabled="state === 'loading'"
        >
          {{ state === 'loading' ? 'Verifying...' : 'Verify right to work' }}
        </button>
      </form>

      <p class="rtw-modal__footer">
        Your verification is stored securely and only needs to be completed once. It will be re-checked when your share code expires.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRtw } from '~/composables/useRtw';
import { RtwVerifySchema } from '~/schemas/rtw';
import type { RtwVerifyInput } from '~/schemas/rtw';

const emit = defineEmits<{ (e: 'verified'): void; (e: 'close'): void }>();

const { verify } = useRtw();
const user = useSupabaseUser();

type FormState = 'idle' | 'loading' | 'success';

const state = ref<FormState>('idle');
const apiError = ref<string | null>(null);
const errors = ref<Record<string, string>>({});
const verifiedName = ref('');
const verifiedExpiry = ref<string | null>(null);

const form = ref<RtwVerifyInput>({
  code: '',
  dob: '',
  forename: '',
  surname: ''
});

const expiryDisplay = computed(() => {
  if (!verifiedExpiry.value) return null;
  const [year, month, day] = verifiedExpiry.value.split('-');
  return `${day}/${month}/${year}`;
});

const prefillFromUser = () => {
  if (user.value && !form.value.forename && !form.value.surname) {
    const meta = user.value.user_metadata ?? {};
    form.value.forename = meta.first_name ?? '';
    form.value.surname = meta.last_name ?? '';
  }
};

onMounted(prefillFromUser);
watch(user, prefillFromUser);

const validate = (): boolean => {
  const result = RtwVerifySchema.safeParse(form.value);
  if (result.success) {
    errors.value = {};
    return true;
  }
  errors.value = result.error.issues.reduce((acc, issue) => {
    const field = issue.path[0] as string;
    if (!acc[field]) acc[field] = issue.message;
    return acc;
  }, {} as Record<string, string>);
  return false;
};

const handleSubmit = async () => {
  apiError.value = null;
  if (!validate()) return;

  state.value = 'loading';
  try {
    const result = await verify(form.value);
    if (result.success) {
      verifiedName.value = result.name ?? form.value.forename;
      verifiedExpiry.value = result.expiry_date ?? null;
      state.value = 'success';
      setTimeout(() => emit('verified'), 2000);
    } else {
      apiError.value = result.message ?? 'Verification failed. Please try again.';
      state.value = 'idle';
    }
  } catch (err: any) {
    apiError.value = err?.data?.data?.errors
      ? Object.values(err.data.data.errors).join('. ')
      : err?.data?.statusMessage ?? 'Something went wrong. Please try again.';
    state.value = 'idle';
  }
};
</script>

<style scoped>
.rtw-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.rtw-modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl, 16px);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.2));
  width: 100%;
  max-width: 520px;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.rtw-modal__header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: center;
}

.rtw-modal__close {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  transition: color 150ms ease, background 150ms ease;
}

.rtw-modal__close:hover {
  color: var(--color-text);
  background: var(--color-surface-2);
}

.rtw-modal__icon {
  font-size: 2.5rem;
  line-height: 1;
}

.rtw-modal__title {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
}

.rtw-modal__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.rtw-modal__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.rtw-modal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.rtw-modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.rtw-modal__field label {
  font-weight: 600;
  font-size: var(--text-sm);
}

.rtw-modal__field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
  background: var(--color-surface);
  transition: border-color 150ms ease;
}

.rtw-modal__field input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.rtw-modal__field input.is-error {
  border-color: var(--color-danger);
}

.rtw-modal__field input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rtw-modal__field-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.rtw-modal__field-hint {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
}

.rtw-modal__field-hint a {
  color: var(--color-primary-600);
}

.rtw-modal__api-error {
  margin: 0;
  padding: var(--space-3);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  border: 1px solid var(--color-danger);
}

.rtw-modal__submit {
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 150ms ease;
  width: 100%;
}

.rtw-modal__submit:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.rtw-modal__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rtw-modal__success {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--color-success-light);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-success);
}

.rtw-modal__success-icon {
  margin: 0;
  font-size: 2rem;
}

.rtw-modal__success h3 {
  margin: 0;
  color: var(--color-success);
}

.rtw-modal__success p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.rtw-modal__footer {
  margin: 0;
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
  line-height: 1.5;
}

@media (max-width: 480px) {
  .rtw-modal {
    padding: var(--space-5);
  }

  .rtw-modal__row {
    grid-template-columns: 1fr;
  }
}
</style>
