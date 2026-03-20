<template>
  <section class="job-detail">
    <NuxtLink class="job-detail__back" to="/jobs">← Back to jobs</NuxtLink>

    <div v-if="loading" class="job-detail__skeletons">
      <LoadingSkeleton variant="block" height="220px" />
      <LoadingSkeleton variant="block" height="160px" />
    </div>

    <EmptyState
      v-else-if="error"
      title="Job unavailable"
      :description="error"
    />

    <template v-else-if="job">
      <JobCard :job="job" />

      <div class="job-detail__layout">
        <div class="job-detail__grid">
          <DataList title="Job info">
            <li>
              <span>Category</span>
              <strong>{{ job.category_name ?? 'General' }}</strong>
            </li>
            <li>
              <span>Budget</span>
              <strong>{{ budgetDisplay }}</strong>
            </li>
            <li>
              <span>Deadline</span>
              <strong>{{ deadlineDisplay }}</strong>
            </li>
            <li>
              <span>Location</span>
              <strong>{{ job.postcode }}</strong>
            </li>
          </DataList>

          <DataList title="Description">
            <li>
              <p class="job-detail__description">{{ job.description }}</p>
            </li>
          </DataList>
        </div>

        <aside v-if="showApplyPanel" class="job-detail__apply">
          <div v-if="workerApplication" class="job-detail__apply-card">
            <p class="job-detail__apply-label">You already applied to this job</p>
            <p class="job-detail__apply-status">
              Current status: <strong>{{ workerApplication.status }}</strong>
            </p>
            <p class="job-detail__apply-hint">We'll email you when the employer responds.</p>
          </div>
          <form v-else @submit.prevent="submitApplication" class="job-detail__apply-card">
            <header>
              <p class="job-detail__apply-label">Ready to help?</p>
              <h3>Apply to this job</h3>
            </header>

            <label class="job-detail__form-field">
              <span>Cover letter</span>
              <textarea
                v-model="applyForm.cover_letter"
                rows="5"
                placeholder="Share why you're a great fit"
              ></textarea>
            </label>

            <label class="job-detail__form-field">
              <span>Proposed rate (optional)</span>
              <input
                v-model="applyForm.proposed_rate"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 120"
              />
            </label>

            <label class="job-detail__form-field">
              <span>Availability notes (optional)</span>
              <input
                v-model="applyForm.availability_notes"
                type="text"
                placeholder="Let the employer know your timing"
              />
            </label>

            <p v-if="applyError" class="job-detail__apply-error">{{ applyError }}</p>
            <p v-if="applySuccess" class="job-detail__apply-success">{{ applySuccess }}</p>

            <button type="submit" class="job-detail__apply-button" :disabled="applySubmitting">
              {{ applySubmitting ? 'Submitting...' : 'Submit application' }}
            </button>
          </form>
        </aside>
      </div>

      <DataList title="Applications" description="Applicants for this job">
        <template v-if="applicationsLoading">
          <li v-for="n in 3" :key="`job-app-${n}`"><LoadingSkeleton variant="block" height="140px" /></li>
        </template>
        <template v-else-if="!applications.length">
          <li>
            <EmptyState title="No applications yet" description="Applications appear here when workers apply." />
          </li>
        </template>
        <template v-else>
          <li v-for="application in applications" :key="application.id">
            <ApplicationCard :application="application" perspective="employer">
              <template #actions>
                <div v-if="isEmployerOwner" class="job-detail__actions">
                  <button
                    type="button"
                    class="job-detail__action-button"
                    :disabled="applicationUpdating[application.id] || application.status === 'pending'"
                    @click="() => updateApplicationStatus(application.id, 'pending')"
                  >
                    Move to pending
                  </button>
                  <button
                    type="button"
                    class="job-detail__action-button job-detail__action-button--success"
                    :disabled="applicationUpdating[application.id] || application.status === 'accepted'"
                    @click="() => updateApplicationStatus(application.id, 'accepted')"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    class="job-detail__action-button job-detail__action-button--danger"
                    :disabled="applicationUpdating[application.id] || application.status === 'rejected'"
                    @click="() => updateApplicationStatus(application.id, 'rejected')"
                  >
                    Reject
                  </button>
                </div>
              </template>
            </ApplicationCard>
          </li>
        </template>
      </DataList>
    </template>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useSupabaseUser } from '#imports';
import JobCard from '~/components/jobs/JobCard.vue';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import ApplicationCard from '~/components/applications/ApplicationCard.vue';
import type { JobWithDetailsInput } from '~/schemas/job';
import type { ApplicationStatus, ApplicationWithDetailsInput } from '~/schemas/application';
import { useJobs } from '~/composables/useJobs';
import { useApplications } from '~/composables/useApplications';
import { useActiveRole } from '~/composables/useActiveRole';

const route = useRoute();
const jobsApi = useJobs();
const applicationsApi = useApplications();
const user = useSupabaseUser();
const { role } = useActiveRole();

const job = ref<JobWithDetailsInput | null>(null);
const applications = ref<ApplicationWithDetailsInput[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const applicationsLoading = ref(true);
const applicationUpdating = ref<Record<string, boolean>>({});

const applyForm = ref({
  cover_letter: '',
  proposed_rate: '',
  availability_notes: ''
});
const applySubmitting = ref(false);
const applyError = ref<string | null>(null);
const applySuccess = ref<string | null>(null);

const jobId = computed(() => route.params.id as string);
const isWorkerRole = computed(() => role.value === 'worker');
const isEmployerOwner = computed(() => role.value === 'employer' && job.value?.employer_id === user.value?.id);
const workerApplication = computed(() =>
  applications.value.find((application) => application.worker_id === user.value?.id) ?? null
);
const showApplyPanel = computed(() => isWorkerRole.value && job.value && job.value.status === 'open');

const canApply = computed(() =>
  !!showApplyPanel.value && !workerApplication.value && job.value?.employer_id !== user.value?.id
);

const budgetDisplay = computed(() => {
  if (!job.value) return '';
  return job.value.budget_type === 'hourly'
    ? `$${job.value.budget_amount}/hr`
    : `$${job.value.budget_amount.toLocaleString()}`;
});

const deadlineDisplay = computed(() => (job.value ? new Date(job.value.deadline).toLocaleDateString() : ''));

const fetchJob = async () => {
  loading.value = true;
  error.value = null;
  job.value = null;
  try {
    const response = await jobsApi.getJob(jobId.value);
    job.value = response.job as JobWithDetailsInput;
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'We could not load this job.';
  } finally {
    loading.value = false;
  }
};

const fetchApplications = async () => {
  applicationsLoading.value = true;
  applications.value = [];
  try {
    const response = await applicationsApi.getJobApplications(jobId.value);
    applications.value = response.applications ?? [];
  } finally {
    applicationsLoading.value = false;
  }
};

const submitApplication = async () => {
  if (!canApply.value || !jobId.value) return;
  applyError.value = null;
  applySuccess.value = null;

  if (!applyForm.value.cover_letter || applyForm.value.cover_letter.trim().length < 10) {
    applyError.value = 'Please add at least 10 characters to your cover letter.';
    return;
  }

  applySubmitting.value = true;
  try {
    await applicationsApi.createApplication({
      job_id: jobId.value,
      cover_letter: applyForm.value.cover_letter.trim(),
      proposed_rate: applyForm.value.proposed_rate ? Number(applyForm.value.proposed_rate) : undefined,
      availability_notes: applyForm.value.availability_notes?.trim() || undefined
    });
    applySuccess.value = "Application submitted. We'll notify the employer.";
    applyForm.value = { cover_letter: '', proposed_rate: '', availability_notes: '' };
    await fetchApplications();
  } catch (err: any) {
    applyError.value = err?.data?.statusMessage || 'Unable to submit application.';
  } finally {
    applySubmitting.value = false;
  }
};

const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
  applicationUpdating.value = { ...applicationUpdating.value, [applicationId]: true };
  try {
    await applicationsApi.updateApplication(applicationId, { status });
    await fetchApplications();
  } catch (err) {
    console.error(err);
  } finally {
    applicationUpdating.value = { ...applicationUpdating.value, [applicationId]: false };
  }
};

watch(jobId, () => {
  fetchJob();
  fetchApplications();
});

onMounted(() => {
  fetchJob();
  fetchApplications();
});
</script>

<style scoped>
.job-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.job-detail__back {
  text-decoration: none;
  color: var(--color-text-muted);
  font-weight: 600;
}

.job-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.job-detail__description {
  margin: 0;
  color: var(--color-text-muted);
}

.job-detail__skeletons {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.job-detail :deep(.data-list li) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
