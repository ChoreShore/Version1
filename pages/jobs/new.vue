<template>
  <section class="job-form-page">
    <header class="job-form-page__header">
      <div>
        <p class="job-form-page__eyebrow">Create opportunity</p>
        <h1>Post a new job</h1>
        <p>Fill out the details below to create your job posting.</p>
      </div>
    </header>

    <!-- Progress Indicator -->
    <div class="form-progress">
      <div v-for="(step, index) in steps" :key="index" class="form-progress__step" :class="{ 'is-active': currentStep === index, 'is-completed': currentStep > index }">
        <div class="form-progress__step-number">{{ currentStep > index ? '✓' : index + 1 }}</div>
        <span class="form-progress__step-label">{{ step.label }}</span>
      </div>
    </div>

    <FormErrorBoundary 
      form-name="job-creation-form"
      @form-error="handleFormError"
      @reset="handleFormReset"
    >
      <form class="job-form" @submit.prevent="handleSubmit">
        <!-- Step 1: Basic -->
        <div v-if="currentStep === 0" class="form-step">
          <h2 class="form-step__title">Basic Information</h2>
          <div class="job-form__grid">
            <FormField id="title" :error="errors.title" :state="getFieldState('title')">
              <FormLabel for="title">Job Title</FormLabel>
              <FormControl>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. House Cleaning Service"
                  required
                  @input="validateField('title')"
                  @blur="validateField('title')"
                />
              </FormControl>
              <FormHint v-if="errors.title">{{ errors.title }}</FormHint>
              <FormSuccess v-if="!errors.title && form.title.length > 0">✓</FormSuccess>
            </FormField>

            <FormField id="category" :error="errors.category_id" :state="getFieldState('category_id')">
              <FormLabel for="category">Category</FormLabel>
              <FormControl>
                <select id="category" v-model="form.category_id" required @change="validateField('category_id')" @blur="validateField('category_id')">
                  <option value="">Select a category</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </FormControl>
              <FormHint v-if="errors.category_id">{{ errors.category_id }}</FormHint>
              <FormSuccess v-if="!errors.category_id && form.category_id">✓</FormSuccess>
            </FormField>
          </div>
        </div>

        <!-- Step 2: Details -->
        <div v-if="currentStep === 1" class="form-step">
          <h2 class="form-step__title">Job Details</h2>
          <FormField id="description" :error="errors.description" :state="getFieldState('description')">
            <FormLabel for="description">Description</FormLabel>
            <FormControl>
              <textarea
                id="description"
                v-model="form.description"
                rows="6"
                placeholder="Describe what you need done..."
                required
                @input="validateField('description')"
                @blur="validateField('description')"
              ></textarea>
            </FormControl>
            <div class="form-field__hint-row">
              <FormHint v-if="errors.description">{{ errors.description }}</FormHint>
              <span class="char-count">{{ form.description.length }}/2000</span>
            </div>
            <FormSuccess v-if="!errors.description && form.description.length >= 10">✓</FormSuccess>
          </FormField>
        </div>

        <!-- Step 3: Budget -->
        <div v-if="currentStep === 2" class="form-step">
          <h2 class="form-step__title">Budget & Timeline</h2>
          <div class="job-form__grid">
            <FormField id="budget_type" :error="errors.budget_type" :state="getFieldState('budget_type')">
              <FormLabel for="budget_type">Budget Type</FormLabel>
              <FormControl>
                <select id="budget_type" v-model="form.budget_type" required @change="validateField('budget_type')" @blur="validateField('budget_type')">
                  <option value="">Select budget type</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </FormControl>
              <FormHint v-if="errors.budget_type">{{ errors.budget_type }}</FormHint>
              <FormSuccess v-if="!errors.budget_type && form.budget_type">✓</FormSuccess>
            </FormField>

            <FormField id="budget_amount" :error="errors.budget_amount" :state="getFieldState('budget_amount')">
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
                  :placeholder="budgetPlaceholder"
                  required
                  @input="validateField('budget_amount')"
                  @blur="validateField('budget_amount')"
                />
              </FormControl>
              <FormHint v-if="errors.budget_amount">{{ errors.budget_amount }}</FormHint>
              <FormSuccess v-if="!errors.budget_amount && form.budget_amount > 0">✓</FormSuccess>
            </FormField>

            <FormField id="deadline" :error="errors.deadline" :state="getFieldState('deadline')">
              <FormLabel for="deadline">Deadline</FormLabel>
              <FormControl>
                <input
                  id="deadline"
                  v-model="form.deadline"
                  type="date"
                  :min="minDate"
                  required
                  @input="validateField('deadline')"
                  @blur="validateField('deadline')"
                />
              </FormControl>
              <FormHint v-if="errors.deadline">{{ errors.deadline }}</FormHint>
              <FormSuccess v-if="!errors.deadline && form.deadline">✓</FormSuccess>
            </FormField>
          </div>
        </div>

        <!-- Step 4: Location -->
        <div v-if="currentStep === 3" class="form-step">
          <h2 class="form-step__title">Location</h2>
          <FormField id="postcode" :error="errors.postcode" :state="getFieldState('postcode')">
            <FormLabel for="postcode">Postcode</FormLabel>
            <FormControl>
              <input
                id="postcode"
                v-model="form.postcode"
                type="text"
                placeholder="e.g. 2000"
                required
                @input="validateField('postcode')"
                @blur="validateField('postcode')"
              />
            </FormControl>
            <FormHint v-if="errors.postcode">{{ errors.postcode }}</FormHint>
            <FormSuccess v-if="!errors.postcode && form.postcode.length >= 4">✓</FormSuccess>
          </FormField>
        </div>

        <!-- Step 5: Review -->
        <div v-if="currentStep === 4" class="form-step">
          <h2 class="form-step__title">Review & Submit</h2>
          <div class="form-review">
            <div class="form-review__section">
              <h3>Basic Information</h3>
              <p><strong>Title:</strong> {{ form.title }}</p>
              <p><strong>Category:</strong> {{ getCategoryName(form.category_id) }}</p>
            </div>
            <div class="form-review__section">
              <h3>Job Details</h3>
              <p><strong>Description:</strong> {{ form.description }}</p>
            </div>
            <div class="form-review__section">
              <h3>Budget & Timeline</h3>
              <p><strong>Budget Type:</strong> {{ form.budget_type }}</p>
              <p><strong>Budget Amount:</strong> ${{ form.budget_amount }}</p>
              <p><strong>Deadline:</strong> {{ form.deadline }}</p>
            </div>
            <div class="form-review__section">
              <h3>Location</h3>
              <p><strong>Postcode:</strong> {{ form.postcode }}</p>
            </div>
          </div>
        </div>

        <div class="job-form__actions">
          <button v-if="currentStep > 0" type="button" class="job-form__secondary" @click="previousStep">
            Back
          </button>
          <button v-if="currentStep < 4" type="button" class="job-form__submit" @click="nextStep" :disabled="!isStepValid">
            Next
          </button>
          <button v-if="currentStep === 4" type="submit" class="job-form__submit" :disabled="submitting">
            {{ submitting ? 'Creating Job...' : 'Post Job' }}
          </button>
          <button type="button" class="job-form__save-draft" @click="saveDraft" :disabled="savingDraft">
            {{ savingDraft ? 'Saving...' : 'Save Draft' }}
          </button>
          <button type="button" class="job-form__cancel" @click="handleCancel">
            Cancel
          </button>
        </div>
      </form>
    </FormErrorBoundary>

    <ConfirmDialog
      :is-open="showConfirmDialog"
      title="Unsaved Changes"
      message="You have unsaved changes. Are you sure you want to leave without saving?"
      confirm-text="Leave"
      cancel-text="Stay"
      @confirm="handleDialogConfirm"
      @cancel="handleDialogCancel"
    />
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});

import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormHint from '~/components/primitives/form/FormHint.vue';
import FormSuccess from '~/components/primitives/form/FormSuccess.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';
import { useJobs } from '~/composables/useJobs';
import { useDirtyForm } from '~/composables/useDirtyForm';
import type { CreateJobInput } from '~/schemas/job';
import { validateCreateJob, CreateJobSchema } from '~/schemas/job';

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

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
const currentStep = ref(0);
const steps = [
  { label: 'Basic', fields: ['title', 'category_id'] },
  { label: 'Details', fields: ['description'] },
  { label: 'Budget', fields: ['budget_type', 'budget_amount', 'deadline'] },
  { label: 'Location', fields: ['postcode'] },
  { label: 'Review', fields: [] }
];
const submitting = ref(false);
const savingDraft = ref(false);
const categories = ref<Array<{ id: string; name: string }>>([]);
const showConfirmDialog = ref(false);

// Use dirty form composable
const { isDirty, resetDirty, confirmNavigation } = useDirtyForm({
  formData: form.value,
  message: 'You have unsaved changes. Are you sure you want to leave without saving?',
  enableBeforeUnload: true
});

const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

const budgetPlaceholder = computed(() => {
  return form.value.budget_type === 'hourly' ? '25.00' : '500.00';
});

const isStepValid = computed(() => {
  const currentFields = steps[currentStep.value].fields;
  return currentFields.every(field => {
    const value = form.value[field as keyof CreateJobInput];
    if (value === undefined || value === null || value === '') return false;
    if (field === 'description' && String(value).length < 10) return false;
    if (field === 'postcode' && String(value).length < 4) return false;
    if (field === 'budget_amount' && Number(value) <= 0) return false;
    return !errors.value[field];
  });
});

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : 'Not selected';
};

const nextStep = () => {
  // Validate current step fields
  const currentFields = steps[currentStep.value].fields;
  currentFields.forEach(field => validateField(field as keyof CreateJobInput));
  
  if (isStepValid.value && currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const saveDraft = async () => {
  savingDraft.value = true;
  try {
    // Save to localStorage
    localStorage.setItem('job-draft', JSON.stringify(form.value));
    alert('Draft saved successfully!');
  } catch (err) {
    alert('Failed to save draft');
  } finally {
    savingDraft.value = false;
  }
};

const loadDraft = () => {
  const saved = localStorage.getItem('job-draft');
  if (saved) {
    try {
      const draft = JSON.parse(saved);
      form.value = { ...form.value, ...draft };
    } catch (err) {
      console.error('Failed to load draft', err);
    }
  }
};

const touchedFields = ref<Set<string>>(new Set());

const getFieldState = (fieldName: string): 'default' | 'success' | 'error' => {
  if (errors.value[fieldName]) return 'error';
  if (touchedFields.value.has(fieldName) && !errors.value[fieldName]) {
    const fieldValue = form.value[fieldName as keyof CreateJobInput];
    if (fieldValue && String(fieldValue).length > 0) return 'success';
  }
  return 'default';
};

const validateField = (fieldName: keyof CreateJobInput) => {
  touchedFields.value.add(fieldName);
  
  try {
    CreateJobSchema.shape[fieldName].parse(form.value[fieldName]);
    delete errors.value[fieldName];
  } catch (error: any) {
    if (error.errors && error.errors[0]) {
      errors.value[fieldName] = error.errors[0].message;
    } else {
      errors.value[fieldName] = 'Invalid value';
    }
  }
};

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
    const payload: CreateJobInput & { client_request_id: string } = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category_id: form.value.category_id,
      budget_type: form.value.budget_type,
      budget_amount: form.value.budget_amount,
      deadline: form.value.deadline,
      postcode: form.value.postcode.trim(),
      client_request_id: generateRequestId()
    };
    
    await jobsApi.createJob(payload);
    resetDirty();
    localStorage.removeItem('job-draft'); // Clear draft after successful submission
    navigateTo('/jobs');
  } catch (err: any) {
    errors.value = err?.data?.statusMessage || 'Failed to create job. Please try again.';
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  if (isDirty as any) {
    showConfirmDialog.value = true;
  } else {
    navigateTo('/jobs');
  }
};

const handleDialogConfirm = () => {
  showConfirmDialog.value = false;
  navigateTo('/jobs');
};

const handleDialogCancel = () => {
  showConfirmDialog.value = false;
};

onMounted(() => {
  loadCategories();
  loadDraft();
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
  justify-content: space-between;
  align-items: center;
}

.job-form__secondary {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.job-form__save-draft {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text-muted);
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

.form-field__hint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
}

.char-count {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.char-count.is-over {
  color: var(--color-error-500);
}

/* Progress Indicator */
.form-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.form-progress__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
}

.form-progress__step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-gray-200);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-sm);
}

.form-progress__step.is-active .form-progress__step-number {
  background: var(--color-primary-600);
  color: white;
}

.form-progress__step.is-completed .form-progress__step-number {
  background: var(--color-success-600);
  color: white;
}

.form-progress__step-label {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.form-progress__step.is-active .form-progress__step-label {
  color: var(--color-primary-600);
  font-weight: 600;
}

.form-progress__step.is-completed .form-progress__step-label {
  color: var(--color-success-600);
}

/* Form Steps */
.form-step {
  margin-bottom: var(--space-6);
}

.form-step__title {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
  color: var(--color-text);
}

/* Form Review */
.form-review {
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}

.form-review__section {
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.form-review__section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.form-review__section h3 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.form-review__section p {
  margin: var(--space-1) 0;
  color: var(--color-text);
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
