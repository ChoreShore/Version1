<template>
  <section class="job-form-page">
    <header class="job-form-page__header">
      <div>
        <p class="job-form-page__eyebrow">Create opportunity</p>
        <h1>Post a new job</h1>
        <p>Fill out the details below to create your job posting.</p>
      </div>
    </header>

    <FormErrorBoundary 
      form-name="job-creation-form"
      @form-error="handleFormError"
      @reset="handleFormReset"
    >
      <form class="job-form" @submit.prevent="handleSubmit">
        <div class="job-form__grid">
          <FormField id="title" :error="errors.title">
            <FormLabel for="title">Job Title</FormLabel>
            <FormControl>
              <input
                id="title"
                v-model="form.title"
                type="text"
                placeholder="e.g. House Cleaning Service"
                required
              />
            </FormControl>
            <FormHint v-if="errors.title">{{ errors.title }}</FormHint>
          </FormField>

          <FormField id="category" :error="errors.category_id">
            <FormLabel for="category">Category</FormLabel>
            <FormControl>
              <select id="category" v-model="form.category_id" required>
                <option value="">Select a category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </FormControl>
            <FormHint v-if="errors.category_id">{{ errors.category_id }}</FormHint>
          </FormField>

          <FormField id="description" class="job-form__full-width" :error="errors.description">
            <FormLabel for="description">Description</FormLabel>
            <FormControl>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                placeholder="Describe what you need done..."
                required
              ></textarea>
            </FormControl>
            <FormHint v-if="errors.description">{{ errors.description }}</FormHint>
          </FormField>

          <FormField id="budget_type" :error="errors.budget_type">
            <FormLabel for="budget_type">Budget Type</FormLabel>
            <FormControl>
              <select id="budget_type" v-model="form.budget_type" required>
                <option value="">Select budget type</option>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </FormControl>
            <FormHint v-if="errors.budget_type">{{ errors.budget_type }}</FormHint>
          </FormField>

          <FormField id="budget_amount" :error="errors.budget_amount">
            <FormLabel for="budget_amount">
              {{ form.budget_type === 'hourly' ? 'Hourly Rate ($)' : 'Budget Amount ($)' }}
            </FormLabel>
            <FormControl>
              <input
                id="budget_amount"
                v-model.number="form.budget_amount"
                type="number"
                min="1"
                step="0.01"
                :placeholder="form.budget_type === 'hourly' ? '25.00' : '500.00'"
                required
              />
            </FormControl>
            <FormHint v-if="errors.budget_amount">{{ errors.budget_amount }}</FormHint>
          </FormField>

          <FormField id="deadline" :error="errors.deadline">
            <FormLabel for="deadline">Deadline</FormLabel>
            <FormControl>
              <input
                id="deadline"
                v-model="form.deadline"
                type="date"
                :min="minDate"
                required
              />
            </FormControl>
            <FormHint v-if="errors.deadline">{{ errors.deadline }}</FormHint>
          </FormField>

          <FormField id="postcode" :error="errors.postcode">
            <FormLabel for="postcode">Postcode</FormLabel>
            <FormControl>
              <input
                id="postcode"
                v-model="form.postcode"
                type="text"
                placeholder="e.g. 2000"
                required
              />
            </FormControl>
            <FormHint v-if="errors.postcode">{{ errors.postcode }}</FormHint>
          </FormField>

        </div>

        <div class="job-form__actions">
          <button type="button" class="job-form__cancel" @click="handleCancel">
            Cancel
          </button>
          <button type="submit" class="job-form__submit" :disabled="submitting">
            {{ submitting ? 'Creating Job...' : 'Post Job' }}
          </button>
        </div>
      </form>
    </FormErrorBoundary>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

import { computed, onMounted, ref } from 'vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import { useJobs } from '~/composables/useJobs';
import type { CreateJobInput } from '~/schemas/job';
import { validateCreateJob } from '~/schemas/job';

const jobsApi = useJobs();

const form = ref<CreateJobInput & { category_id: string }>({
  title: '',
  description: '',
  category_id: '',
  budget_type: 'fixed',
  budget_amount: 0,
  deadline: '',
  postcode: ''
});

const errors = ref<Record<string, string>>({});
const submitting = ref(false);
const categories = ref<Array<{ id: string; name: string }>>([]);

const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

const loadCategories = async () => {
  try {
    const response = await jobsApi.listCategories();
    categories.value = response.categories || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
};

const validateForm = () => {
  // Use Zod validation for better error messages
  const zodValidation = validateCreateJob(form.value);
  
  if (zodValidation.success) {
    errors.value = {};
    return true;
  } else {
    errors.value = zodValidation.errors || {};
    return false;
  }
  
  // Keep legacy validation as fallback (commented out for now)
  /*
  errors.value = {};
  
  if (!form.value.title.trim()) {
    errors.value.title = 'Job title is required';
  }
  
  if (!form.value.category_id) {
    errors.value.category_id = 'Please select a category';
  }
  
  if (!form.value.description.trim()) {
    errors.value.description = 'Job description is required';
  }
  
  if (!form.value.budget_type) {
    errors.value.budget_type = 'Please select a budget type';
  }
  
  if (!form.value.budget_amount || form.value.budget_amount <= 0) {
    errors.value.budget_amount = 'Please enter a valid budget amount';
  }
  
  if (!form.value.deadline) {
    errors.value.deadline = 'Please select a deadline';
  }
  
  if (!form.value.postcode.trim()) {
    errors.value.postcode = 'Postcode is required';
  }
  
  return Object.keys(errors.value).length === 0;
  */
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  submitting.value = true;
  
  try {
    const payload: CreateJobInput = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category_id: form.value.category_id,
      budget_type: form.value.budget_type,
      budget_amount: form.value.budget_amount,
      deadline: form.value.deadline,
      postcode: form.value.postcode.trim()
    };
    
    await jobsApi.createJob(payload);
    
    // Redirect to dashboard to see the new job
    navigateTo('/dashboard');
  } catch (error: any) {
    errors.value.general = error?.data?.statusMessage || 'Failed to create job. Please try again.';
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  navigateTo('/jobs');
};

onMounted(() => {
  loadCategories();
});

// Error boundary handlers
const handleFormError = (error: Error, formName?: string) => {
  console.error(`Form error in ${formName}:`, error);
  // You could also send this to your error monitoring service
};

const handleFormReset = () => {
  // Reset form data when error boundary reset is triggered
  form.value = {
    title: '',
    description: '',
    category_id: '',
    budget_type: 'fixed',
    budget_amount: 0,
    deadline: '',
    postcode: ''
  };
  errors.value = {};
};
</script>

<style scoped>
.job-form-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}

.job-form-page__header {
  text-align: center;
}

.job-form-page__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.job-form {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.job-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.job-form__full-width {
  grid-column: 1 / -1;
}

.job-form__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

.job-form__cancel {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 12px 24px;
  cursor: pointer;
}

.job-form__cancel:hover {
  background: var(--color-surface-muted);
}

.job-form__submit {
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  cursor: pointer;
}

.job-form__submit:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.job-form__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .job-form__grid {
    grid-template-columns: 1fr;
  }
  
  .job-form__actions {
    flex-direction: column-reverse;
  }
}
</style>
