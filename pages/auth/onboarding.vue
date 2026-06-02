<template>
  <div class="onboarding-page">
    <div class="onboarding-container">
      <div class="onboarding-card">
        <header class="onboarding-header">
          <h1 class="onboarding-title">Set up your profile</h1>
          <p class="onboarding-subtitle">
            Step {{ currentStep + 1 }} of {{ steps.length }} — {{ steps[currentStep].description }}
          </p>
        </header>

        <!-- Progress Indicator -->
        <div class="onboarding-progress" role="navigation" aria-label="Onboarding progress">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="onboarding-progress__step"
            :class="{
              'is-active': currentStep === index,
              'is-completed': currentStep > index
            }"
            :aria-current="currentStep === index ? 'step' : undefined"
          >
            <div class="onboarding-progress__number" :aria-hidden="true">
              {{ currentStep > index ? '✓' : index + 1 }}
            </div>
            <span class="onboarding-progress__label">{{ step.label }}</span>
          </div>
        </div>

        <FormErrorBoundary
          form-name="worker-onboarding-form"
          @form-error="handleFormError"
          @reset="handleFormReset"
        >
          <!-- Generic Error -->
          <div v-if="genericError" class="onboarding-generic-error" role="alert">
            {{ genericError }}
          </div>

          <!-- Step 1: Role -->
          <div v-if="currentStep === 0" class="onboarding-step">
            <h2 class="onboarding-step__title">How will you use HireBeHired?</h2>
            <p class="onboarding-step__hint">You can change this later in your settings.</p>

            <div class="role-selection">
              <button
                type="button"
                class="role-card"
                :class="{ 'is-selected': form.role === 'employer' }"
                @click="form.role = 'employer'"
              >
                <div class="role-card__icon">🏢</div>
                <div class="role-card__content">
                  <h3>Hire talent</h3>
                  <p>Post jobs and find skilled workers for your projects</p>
                </div>
              </button>

              <button
                type="button"
                class="role-card"
                :class="{ 'is-selected': form.role === 'worker' }"
                @click="form.role = 'worker'"
              >
                <div class="role-card__icon">🛠️</div>
                <div class="role-card__content">
                  <h3>Find work</h3>
                  <p>Browse jobs, apply, and get hired for your skills</p>
                </div>
              </button>
            </div>

            <div v-if="errors.role" class="onboarding-field-error" role="alert">
              {{ errors.role }}
            </div>
          </div>

          <!-- Step 2: Location & Categories -->
          <div v-if="currentStep === 1" class="onboarding-step">
            <h2 class="onboarding-step__title">Where do you work &amp; what do you do?</h2>

            <FormField id="postcode" :error="errors.postcode" :state="getFieldState('postcode')">
              <FormLabel for="postcode">Your Postcode</FormLabel>
              <FormControl>
                <input
                  id="postcode"
                  v-model="form.postcode"
                  type="text"
                  placeholder="e.g. SW1A 1AA"
                  required
                  @input="validateField('postcode')"
                  @blur="validateField('postcode')"
                />
              </FormControl>
              <FormError v-if="errors.postcode">{{ errors.postcode }}</FormError>
              <FormSuccess v-if="!errors.postcode && form.postcode.length >= 4">
                <Check :size="16" class="success-icon" />
              </FormSuccess>
            </FormField>

            <div class="category-section">
              <FormLabel>Select the categories you want to work in</FormLabel>
              <p class="category-hint">Pick at least one. You can change this later.</p>

              <div class="category-grid">
                <label
                  v-for="category in categories"
                  :key="category.id"
                  class="category-option"
                  :class="{ 'is-selected': form.category_ids.includes(category.id) }"
                >
                  <input
                    type="checkbox"
                    :value="category.id"
                    v-model="form.category_ids"
                    @change="validateCategories"
                  />
                  <span>{{ category.name }}</span>
                </label>
              </div>

              <div v-if="errors.category_ids" class="onboarding-field-error" role="alert">
                {{ errors.category_ids }}
              </div>
            </div>
          </div>

          <!-- Step 3: Profile -->
          <div v-if="currentStep === 2" class="onboarding-step">
            <h2 class="onboarding-step__title">Tell employers about yourself</h2>

            <!-- Photo preview -->
            <div v-if="form.photo_url" class="photo-preview">
              <img :src="form.photo_url" alt="Your profile photo" class="photo-preview__image" />
            </div>

            <FormField id="bio" :error="errors.bio" :state="getFieldState('bio')">
              <FormLabel for="bio">Bio</FormLabel>
              <FormControl>
                <textarea
                  id="bio"
                  v-model="form.bio"
                  rows="4"
                  placeholder="Tell employers a little about yourself and your experience..."
                  @input="validateField('bio')"
                  @blur="validateField('bio')"
                ></textarea>
              </FormControl>
              <div class="form-field__hint-row">
                <FormError v-if="errors.bio">{{ errors.bio }}</FormError>
                <span class="char-count">{{ (form.bio || '').length }}/500</span>
              </div>
            </FormField>

            <div class="skills-section">
              <FormLabel>Skills</FormLabel>
              <p class="skills-hint">Add up to 10 skills that describe what you can do (e.g. Plumbing, Gardening, Painting)</p>

              <div class="skills-input-row">
                <input
                  v-model="newSkill"
                  type="text"
                  placeholder="Add a skill and press Enter"
                  maxlength="30"
                  @keydown.enter.prevent="addSkill"
                />
                <button type="button" class="skills-add-btn" @click="addSkill">Add</button>
              </div>

              <div v-if="errors.skills" class="onboarding-field-error" role="alert">
                {{ errors.skills }}
              </div>

              <div class="skills-tags">
                <span
                  v-for="skill in form.skills"
                  :key="skill"
                  class="skill-tag"
                >
                  {{ skill }}
                  <button type="button" class="skill-tag__remove" @click="removeSkill(skill)">
                    ×
                  </button>
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="onboarding-actions">
            <button
              v-if="currentStep > 0"
              type="button"
              class="onboarding-btn onboarding-btn--secondary"
              @click="previousStep"
            >
              Back
            </button>
            <button
              v-if="currentStep < steps.length - 1"
              type="button"
              class="onboarding-btn onboarding-btn--primary"
              :disabled="!isStepValid"
              @click="nextStep"
            >
              Next
            </button>
            <button
              v-if="currentStep === steps.length - 1"
              type="button"
              class="onboarding-btn onboarding-btn--primary"
              :disabled="!isStepValid || submitting"
              @click="handleSubmit"
            >
              {{ submitting ? 'Saving...' : 'Complete Profile' }}
            </button>
          </div>
        </FormErrorBoundary>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Check } from '@lucide/vue';
import FormField from '~/components/primitives/form/FormField.vue';
import FormLabel from '~/components/primitives/form/FormLabel.vue';
import FormControl from '~/components/primitives/form/FormControl.vue';
import FormError from '~/components/primitives/form/FormError.vue';
import FormSuccess from '~/components/primitives/form/FormSuccess.vue';
import FormErrorBoundary from '~/components/primitives/FormErrorBoundary.vue';
import { WorkerOnboardingSchema } from '~/schemas/worker';
import type { WorkerOnboardingInput } from '~/schemas/worker';

definePageMeta({
  layout: false,
  title: 'Complete Your Profile - HireBeHired'
});

const router = useRouter();
const client = useSupabaseClient();
const user = useSupabaseUser();

const currentStep = ref(0);
const steps = [
  { label: 'Role', description: 'Choose how you will use the platform' },
  { label: 'Work', description: 'Set your location and categories' },
  { label: 'Profile', description: 'Add your bio and skills' }
];

const categories = ref<Array<{ id: string; name: string }>>([]);
const loading = ref(false);
const submitting = ref(false);
const genericError = ref<string | null>(null);
const newSkill = ref('');

const form = reactive<WorkerOnboardingInput>({
  role: 'worker',
  postcode: '',
  category_ids: [],
  bio: '',
  skills: [],
  photo_url: null
});

const errors = reactive<Record<string, string>>({});
const touchedFields = ref<Set<string>>(new Set());

const getFieldState = (fieldName: string): 'default' | 'success' | 'error' => {
  if (errors[fieldName]) return 'error';
  if (touchedFields.value.has(fieldName) && !errors[fieldName]) {
    const value = form[fieldName as keyof WorkerOnboardingInput];
    if (value !== '' && value !== null && value !== undefined) return 'success';
  }
  return 'default';
};

const validateField = (fieldName: keyof WorkerOnboardingInput) => {
  touchedFields.value.add(fieldName as string);
  try {
    WorkerOnboardingSchema.shape[fieldName as keyof typeof WorkerOnboardingSchema.shape].parse(form[fieldName]);
    delete errors[fieldName];
  } catch (error: any) {
    if (error.errors?.[0]) {
      errors[fieldName] = error.errors[0].message;
    } else {
      errors[fieldName] = 'Invalid value';
    }
  }
};

const validateCategories = () => {
  touchedFields.value.add('category_ids');
  if (form.category_ids.length === 0) {
    errors.category_ids = 'Select at least one category';
  } else {
    delete errors.category_ids;
  }
};

const isStepValid = computed(() => {
  if (currentStep.value === 0) {
    return !!form.role;
  }
  if (currentStep.value === 1) {
    return form.postcode.length >= 4 && form.postcode.length <= 10 && form.category_ids.length > 0;
  }
  if (currentStep.value === 2) {
    const bioValid = !errors.bio;
    const skillsValid = !errors.skills;
    return bioValid && skillsValid;
  }
  return false;
});

const nextStep = () => {
  if (currentStep.value === 0) validateField('role');
  if (currentStep.value === 1) {
    validateField('postcode');
    validateCategories();
  }
  if (currentStep.value === 2) {
    validateField('bio');
    validateField('skills');
  }

  if (isStepValid.value && currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const addSkill = () => {
  const skill = newSkill.value.trim().toLowerCase();
  if (!skill) return;
  if (form.skills!.includes(skill)) {
    newSkill.value = '';
    return;
  }
  if (form.skills!.length >= 10) {
    errors.skills = 'You can add up to 10 skills';
    return;
  }
  form.skills!.push(skill);
  newSkill.value = '';
  delete errors.skills;
};

const removeSkill = (skill: string) => {
  form.skills = form.skills!.filter((s) => s !== skill);
  delete errors.skills;
};

const handleSubmit = async () => {
  if (!isStepValid.value) return;

  submitting.value = true;
  genericError.value = null;

  try {
    await $fetch('/api/worker/onboarding', {
      method: 'POST',
      body: {
        role: form.role,
        postcode: form.postcode,
        category_ids: form.category_ids,
        bio: form.bio,
        skills: form.skills,
        photo_url: form.photo_url
      }
    });

    router.push('/dashboard');
  } catch (err: any) {
    genericError.value = err?.data?.statusMessage || 'Failed to save your profile. Please try again.';
  } finally {
    submitting.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await $fetch('/api/jobs/categories');
    categories.value = (response as any).categories || [];
  } catch (error) {
    if (import.meta.dev) {
      console.error('Failed to load categories:', error);
    }
  }
};

const fetchProfile = async () => {
  if (!user.value) return;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('postcode, bio, photo_url, roles, worker_categories, worker_skills, onboarding_completed')
      .eq('id', user.value.id)
      .single();

    if (error) throw error;

    // If already onboarded, redirect to dashboard
    if ((data as any)?.onboarding_completed) {
      router.push('/dashboard');
      return;
    }

    // Pre-fill existing data
    if (data) {
      const profile = data as any;
      form.postcode = profile.postcode || user.value.user_metadata?.postcode || '';
      form.bio = profile.bio || '';
      form.photo_url = profile.photo_url || null;
      form.category_ids = profile.worker_categories || [];
      form.skills = profile.worker_skills || [];

      // Set role based on profile roles or user metadata
      const roles = profile.roles || [];
      if (roles.includes('worker')) {
        form.role = 'worker';
      } else if (roles.includes('employer')) {
        form.role = 'employer';
      } else {
        form.role = user.value.user_metadata?.role || 'worker';
      }
    }
  } catch (err: any) {
    if (import.meta.dev) {
      console.error('Failed to load profile:', err);
    }
  }
};

const handleFormError = (error: Error) => {
  if (import.meta.dev) {
    console.error('Form error:', error);
  }
};

const handleFormReset = () => {
  genericError.value = null;
};

onMounted(() => {
  if (!user.value) {
    router.push('/auth/sign-in');
    return;
  }
  fetchProfile();
  fetchCategories();
});
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-secondary-50) 100%);
  padding: var(--space-4);
}

.onboarding-container {
  width: 100%;
  max-width: 640px;
}

.onboarding-card {
  background: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  padding: var(--space-8);
}

.onboarding-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.onboarding-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--space-2);
}

.onboarding-subtitle {
  color: var(--color-gray-600);
  font-size: var(--text-sm);
  margin: 0;
}

.onboarding-progress {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-gray-200);
}

.onboarding-progress__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
}

.onboarding-progress__number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-gray-200);
  color: var(--color-gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  transition: background 150ms var(--ease-out), color 150ms var(--ease-out);
}

.onboarding-progress__step.is-active .onboarding-progress__number {
  background: var(--color-primary-600);
  color: white;
}

.onboarding-progress__step.is-completed .onboarding-progress__number {
  background: var(--color-success-500);
  color: white;
}

.onboarding-progress__label {
  font-size: var(--text-xs);
  color: var(--color-gray-500);
  font-weight: var(--font-medium);
}

.onboarding-progress__step.is-active .onboarding-progress__label {
  color: var(--color-primary-600);
}

.onboarding-step {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.onboarding-step__title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
  margin: 0;
}

.onboarding-step__hint {
  color: var(--color-gray-500);
  font-size: var(--text-sm);
  margin: 0;
}

.role-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  background: white;
  cursor: pointer;
  transition: border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out);
  text-align: center;
}

.role-card:hover {
  border-color: var(--color-primary-300);
}

.role-card.is-selected {
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.role-card__icon {
  font-size: var(--text-3xl);
}

.role-card__content h3 {
  margin: 0 0 var(--space-1);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-gray-900);
}

.role-card__content p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-gray-500);
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.category-hint {
  color: var(--color-gray-500);
  font-size: var(--text-sm);
  margin: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}

.category-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
  transition: border-color 150ms var(--ease-out), background 150ms var(--ease-out);
}

.category-option:hover {
  border-color: var(--color-primary-300);
}

.category-option.is-selected {
  border-color: var(--color-primary-600);
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.category-option input[type="checkbox"] {
  accent-color: var(--color-primary-600);
}

.skills-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skills-hint {
  color: var(--color-gray-500);
  font-size: var(--text-sm);
  margin: 0;
}

.skills-input-row {
  display: flex;
  gap: var(--space-2);
}

.skills-input-row input {
  flex: 1;
  padding: var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

.skills-input-row input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.skills-add-btn {
  padding: var(--space-3) var(--space-4);
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: background 150ms var(--ease-out);
}

.skills-add-btn:hover {
  background: var(--color-primary-700);
}

.skills-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

.skill-tag__remove {
  background: none;
  border: none;
  color: var(--color-primary-600);
  cursor: pointer;
  font-size: var(--text-base);
  line-height: 1;
  padding: 0;
  margin-left: var(--space-1);
}

.skill-tag__remove:hover {
  color: var(--color-primary-800);
}

.photo-preview {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-4);
}

.photo-preview__image {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-gray-200);
}

.onboarding-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-6);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-gray-200);
}

.onboarding-btn {
  padding: 14px 24px;
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  cursor: pointer;
  transition: background 150ms var(--ease-out), opacity 150ms var(--ease-out);
  border: none;
  font-size: var(--text-base);
}

.onboarding-btn--primary {
  background: var(--color-primary-600);
  color: white;
  margin-left: auto;
}

.onboarding-btn--primary:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.onboarding-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.onboarding-btn--secondary {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

.onboarding-btn--secondary:hover {
  background: var(--color-gray-200);
}

.onboarding-generic-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-error-200);
  font-size: var(--text-sm);
  margin-bottom: var(--space-4);
}

.onboarding-field-error {
  color: var(--color-error-600);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
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

.success-icon {
  display: inline-flex;
  align-items: center;
  color: var(--color-success-600);
}

@media (max-width: 520px) {
  .role-selection {
    grid-template-columns: 1fr;
  }

  .onboarding-card {
    padding: var(--space-6);
  }

  .onboarding-progress {
    gap: var(--space-3);
  }
}
</style>
