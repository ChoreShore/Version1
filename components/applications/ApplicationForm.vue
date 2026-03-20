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
        required
      ></textarea>
    </label>

    <label class="application-form__field">
      <span>Proposed rate (optional)</span>
      <input
        v-model="form.proposed_rate"
        type="number"
        min="0"
        step="1"
        placeholder="e.g. 120"
      />
    </label>

    <label class="application-form__field">
      <span>Availability notes (optional)</span>
      <input
        v-model="form.availability_notes"
        type="text"
        placeholder="Let the employer know your timing"
      />
    </label>

    <p v-if="error" class="application-form__error">{{ error }}</p>
    <p v-if="success" class="application-form__success">{{ success }}</p>

    <button type="submit" class="application-form__button" :disabled="submitting">
      {{ submitting ? 'Submitting...' : 'Submit application' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ApplicationWithDetails } from '~/schemas/application';

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
    availability_notes?: string;
  }];
}>();

const form = ref({
  cover_letter: '',
  proposed_rate: '',
  availability_notes: ''
});

const handleSubmit = () => {
  if (!form.value.cover_letter || form.value.cover_letter.trim().length < 10) {
    return;
  }

  emit('submit', {
    cover_letter: form.value.cover_letter.trim(),
    proposed_rate: form.value.proposed_rate ? Number(form.value.proposed_rate) : undefined,
    availability_notes: form.value.availability_notes?.trim() || undefined
  });
};

// Reset form when submission succeeds
watch(() => props.success, (newSuccess) => {
  if (newSuccess) {
    form.value = { cover_letter: '', proposed_rate: '', availability_notes: '' };
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
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.application-form__button:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.application-form__button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
