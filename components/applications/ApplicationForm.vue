<template>
  <FormErrorBoundary 
    form-name="application-form"
    @form-error="handleFormError"
    @reset="handleFormReset"
  >
    <div v-if="workerApplication" class="application-form__status">
      <p class="application-form__label">You already applied to this job</p>
      <p class="application-form__status-text">
        Current status: <strong>{{ workerApplication.status }}</strong>
      </p>
      <p class="application-form__hint">We'll notify you when the employer responds.</p>
    </div>
    <form v-else @submit.prevent="handleSubmit" class="application-form">
      <header>
        <p class="application-form__label">Apply to this job</p>
        <h3>Submit your application</h3>
      </header>

      <label class="application-form__field">
        <span>Cover letter (optional) — Introduce yourself and explain why you're a great fit</span>
        <textarea
          v-model="form.cover_letter"
          rows="5"
          maxlength="1000"
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
          :min="rateLimits.min"
          :max="rateLimits.max"
          step="1"
          :placeholder="`e.g. ${Math.round(rateLimits.max * 0.5)}`"
          :class="{ 'application-form__input--error': fieldErrors.proposed_rate }"
        />
        <p v-if="fieldErrors.proposed_rate" class="application-form__field-error">
          {{ fieldErrors.proposed_rate }}
        </p>
      </label>

      
      <p v-if="error" class="application-form__error">{{ error }}</p>
      <p v-if="success" class="application-form__success">{{ success }}</p>

      <button type="submit" class="application-form__button" :disabled="submitting || !isFormValid">
        {{ submitting ? 'Sending...' : 'Submit application' }}
      </button>
    </form>
  </FormErrorBoundary>

  <ConfirmDialog
    :is-open="showConfirmDialog"
    title="Unsaved Changes"
    message="You haven't submitted your application yet. Are you sure you want to leave?"
    confirm-text="Cancel Application"
    cancel-text="Continue"
    @confirm="handleDialogConfirm"
    @cancel="handleDialogCancel"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { z } from 'zod';
import type { ApplicationWithDetails } from '~/schemas/application';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';
import { useDirtyForm } from '~/composables/useDirtyForm';

// Form validation schema using Zod (dynamic based on rate limits)
const applicationFormSchema = computed(() => z.object({
  cover_letter: z.string()
    .min(10, 'Cover letter must be at least 10 characters')
    .max(1000, 'Cover letter must be less than 1000 characters')
    .trim()
    .optional(),
  proposed_rate: z.number()
    .min(rateLimits.value.min, `Rate must be at least £${rateLimits.value.min}`)
    .max(rateLimits.value.max, `Rate must be no more than £${rateLimits.value.max.toFixed(2)}`)
    .optional()
}));

const props = defineProps<{
  jobId: string;
  workerApplication: ApplicationWithDetails | null;
  submitting: boolean;
  error: string | null;
  success: string | null;
  budgetType?: 'fixed' | 'hourly';
  budgetAmount?: number;
  estimatedHours?: number | null;
}>();

const emit = defineEmits<{
  submit: [data: {
    cover_letter?: string;
    proposed_rate?: number;
  }];
}>();

const form = ref({
  cover_letter: '',
  proposed_rate: ''
});

const showConfirmDialog = ref(false);

// Calculate dynamic rate limits based on job budget
const rateLimits = computed(() => {
  const minRate = 1; // Minimum floor
  let maxRate = 1000; // Default high ceiling

  if (props.budgetType === 'hourly' && props.budgetAmount) {
    if (props.estimatedHours && props.estimatedHours > 0) {
      // For hourly jobs with estimated hours, max rate shouldn't exceed budget/hours
      maxRate = props.budgetAmount / props.estimatedHours;
    } else {
      // For hourly jobs without estimated hours, use budget as ceiling
      maxRate = props.budgetAmount;
    }
  } else if (props.budgetType === 'fixed' && props.budgetAmount) {
    // For fixed jobs, use a reasonable percentage of budget as ceiling
    maxRate = props.budgetAmount;
  }

  return {
    min: minRate,
    max: Math.max(minRate, maxRate)
  };
});

// Use dirty form composable
const { isDirty, resetDirty } = useDirtyForm({
  formData: form.value,
  message: 'You have unsaved changes. Are you sure you want to cancel your application?',
  enableBeforeUnload: true
});

// Computed property for field validation errors
const fieldErrors = computed(() => {
  const result = applicationFormSchema.value.safeParse({
    cover_letter: form.value.cover_letter,
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });
  
  if (!result.success) {
    return result.error.issues.reduce((acc: Record<string, string>, issue) => {
      const field = issue.path[0] as string;
      acc[field] = issue.message;
      return acc;
    }, {});
  }
  
  return {};
});

// Check if form is valid
const isFormValid = computed(() => {
  return Object.keys(fieldErrors.value).length === 0;
});

const handleSubmit = () => {
  // Clear any existing errors first
  const validation = applicationFormSchema.value.safeParse({
    cover_letter: form.value.cover_letter,
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });

  if (!validation.success) {
    // Don't submit if validation fails
    return;
  }

  emit('submit', {
    cover_letter: form.value.cover_letter.trim() || undefined,
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined
  });
};

// Reset form when submission succeeds
watch(() => props.success, (newSuccess) => {
  if (newSuccess) {
    form.value = { cover_letter: '', proposed_rate: '' };
    resetDirty();
  }
});

const handleDialogConfirm = () => {
  showConfirmDialog.value = false;
  form.value = { cover_letter: '', proposed_rate: '' };
  resetDirty();
};

const handleDialogCancel = () => {
  showConfirmDialog.value = false;
};

// Error boundary handlers
const handleFormError = (error: Error, formName?: string) => {
  // Client-side error logging - console is acceptable in browser
  if (import.meta.dev) {
    console.error(`Form error in ${formName}:`, error);
  }
  // You could also send this to your error monitoring service
};

const handleFormReset = () => {
  // Reset form data when error boundary reset is triggered
  form.value = { cover_letter: '', proposed_rate: '' };
  resetDirty();
};
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
  background: var(--color-primary-500) !important;
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
  background: var(--color-primary-600);
}

.application-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
