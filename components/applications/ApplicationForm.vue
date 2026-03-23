<template>
  <div v-if="workerApplication" class="application-form__status">
    <p class="application-form__label">You already applied to this job</p>
    <p class="application-form__status-text">
      Current status: <strong>{{ workerApplication.status }}</strong>
    </p>
    <p class="application-form__hint">We'll email you when the employer responds.</p>
  </div>
  <form v-else @submit.prevent="handleSubmit" class="application-form">
    <header>
      <p class="application-form__label">Ready to help?</p>
      <h3>Apply to this job</h3>
    </header>

    <label class="application-form__field">
      <span>Cover letter</span>
      <textarea
        v-model="form.cover_letter"
        rows="5"
        placeholder="Share why you're a great fit"
        :class="{ 'application-form__input--error': fieldErrors.cover_letter }"
      ></textarea>
      <p v-if="fieldErrors.cover_letter" class="application-form__field-error">
        {{ fieldErrors.cover_letter }}
      </p>
    </label>

    <label class="application-form__field">
      <span>Proposed rate (optional)</span>
      <input
        v-model="form.proposed_rate"
        type="number"
        min="0"
        step="1"
        placeholder="e.g. 120"
        :class="{ 'application-form__input--error': fieldErrors.proposed_rate }"
      />
      <p v-if="fieldErrors.proposed_rate" class="application-form__field-error">
        {{ fieldErrors.proposed_rate }}
      </p>
    </label>

    
    <p v-if="error" class="application-form__error">{{ error }}</p>
    <p v-if="success" class="application-form__success">{{ success }}</p>

    <button type="submit" class="application-form__button" :disabled="submitting || !isFormValid">
      {{ submitting ? 'Submitting...' : 'Submit application' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { z } from 'zod';
import type { ApplicationWithDetails } from '~/schemas/application';

// Form validation schema using Zod
const applicationFormSchema = z.object({
  cover_letter: z.string()
    .min(10, 'Cover letter must be at least 10 characters')
    .max(1000, 'Cover letter must be less than 1000 characters')
    .trim(),
  proposed_rate: z.number()
    .positive('Rate must be positive')
    .max(10000, 'Rate too high')
    .optional()
});

const props = defineProps<{
  jobId: string;
  workerApplication: ApplicationWithDetails | null;
  submitting: boolean;
  error: string | null;
  success: string | null;
}>();

const emit = defineEmits<{
  submit: [data: {
    cover_letter: string;
    proposed_rate?: number;
  }];
}>();

const form = ref({
  cover_letter: '',
  proposed_rate: ''
});

// Computed property for field validation errors
const fieldErrors = computed(() => {
  const result = applicationFormSchema.safeParse({
    cover_letter: form.value.cover_letter,
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });
  
  if (!result.success) {
    return result.error.issues.reduce((acc, issue) => {
      const field = issue.path[0] as string;
      acc[field] = issue.message;
      return acc;
    }, {} as Record<string, string>);
  }
  
  return {};
});

// Check if form is valid
const isFormValid = computed(() => {
  return Object.keys(fieldErrors.value).length === 0 && form.value.cover_letter.trim().length >= 10;
});

const handleSubmit = () => {
  // Clear any existing errors first
  const validation = applicationFormSchema.safeParse({
    cover_letter: form.value.cover_letter,
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });

  if (!validation.success) {
    // Don't submit if validation fails
    return;
  }

  emit('submit', {
    cover_letter: form.value.cover_letter.trim(),
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });
};

// Reset form when submission succeeds
watch(() => props.success, (newSuccess) => {
  if (newSuccess) {
    form.value = { cover_letter: '', proposed_rate: '' };
  }
});
</script>

<style scoped>
.application-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.application-form__status {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.application-form__label {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.application-form__status-text {
  margin: 0;
  font-weight: 600;
}

.application-form__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.application-form h3 {
  margin: 0;
  font-size: var(--text-lg);
}

.application-form__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.application-form__field span {
  font-weight: 600;
  font-size: var(--text-sm);
}

.application-form__field textarea,
.application-form__field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
}

.application-form__field textarea:focus,
.application-form__field input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -1px;
}

.application-form__input--error {
  border-color: var(--color-danger) !important;
}

.application-form__input--error:focus {
  outline-color: var(--color-danger) !important;
}

.application-form__field-error {
  margin: var(--space-1) 0 0 0;
  color: var(--color-danger);
  font-size: var(--text-xs);
  font-weight: 500;
}

.application-form__error {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.application-form__success {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.application-form__button {
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary) !important;
  color: white !important;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 100%;
}

.application-form__button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.application-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
