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

      <div v-if="isEmployerOwner" class="job-detail__status-control">
        <label for="job-status">Job Status</label>
        <select 
          id="job-status" 
          v-model="jobStatus" 
          :disabled="statusUpdating"
          @change="updateJobStatus"
          class="job-detail__status-select"
        >
          <option value="draft">Draft</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="completed">Completed</option>
        </select>
        <span v-if="statusUpdating" class="job-detail__status-updating">Updating...</span>
        <button 
          type="button" 
          class="job-detail__delete-button" 
          :disabled="deleting"
          @click="showDeleteDialog = true"
        >
          {{ deleting ? 'Deleting...' : 'Delete Job' }}
        </button>
      </div>

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
          <div v-if="isRtwRequired" class="rtw-gate">
            <p class="rtw-gate__icon">🪪</p>
            <h3 class="rtw-gate__title">Right to work required</h3>
            <p class="rtw-gate__body">You must verify your UK right to work before applying to jobs on ChoreShore.</p>
            <button type="button" class="rtw-gate__button" @click="showRtwModal = true">
              Verify now
            </button>
            <RtwVerificationModal v-if="showRtwModal" @verified="onRtwVerified" @close="showRtwModal = false" />
          </div>
          <ApplicationForm
            v-else
            :job-id="jobId"
            :worker-application="workerApplication"
            :submitting="applySubmitting"
            :error="applyError"
            :success="applySuccess"
            @submit="submitApplication"
          />
        </aside>
      </div>

      <DataList v-if="isEmployerOwner" title="Applications" description="Applicants for this job">
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
                <ApplicationActions
                  v-if="isEmployerOwner"
                  :application="application"
                  :disabled="applicationUpdating[application.id]"
                  @action="updateApplicationStatus"
                />
              </template>
            </ApplicationCard>
          </li>
        </template>
      </DataList>

      <ConfirmDialog
        :is-open="showDeleteDialog"
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirm-text="Delete"
        cancel-text="Cancel"
        @confirm="deleteJob"
        @cancel="showDeleteDialog = false"
      />
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
import ApplicationForm from '~/components/applications/ApplicationForm.vue';
import ApplicationActions from '~/components/applications/ApplicationActions.vue';
import ConfirmDialog from '~/components/primitives/ConfirmDialog.vue';
import type { JobWithDetailsInput, JobStatus } from '~/schemas/job';
import type { ApplicationStatus, ApplicationWithDetailsInput } from '~/schemas/application';
import { useJobs } from '~/composables/useJobs';
import { useApplications } from '~/composables/useApplications';
import { useActiveRole } from '~/composables/useActiveRole';
import { useRtw } from '~/composables/useRtw';
import RtwVerificationModal from '~/components/profile/RtwVerificationModal.vue';

const route = useRoute();
const jobsApi = useJobs();
const applicationsApi = useApplications();
const user = useSupabaseUser();
const { role } = useActiveRole();
const { isRtwRequired, fetchRtwStatus } = useRtw();
const showRtwModal = ref(false);
const showDeleteDialog = ref(false);
const deleting = ref(false);

const job = ref<JobWithDetailsInput | null>(null);
const applications = ref<ApplicationWithDetailsInput[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const applicationsLoading = ref(true);
const applicationUpdating = ref<Record<string, boolean>>({});
const statusUpdating = ref(false);
const jobStatus = ref<JobStatus>('open');

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
    jobStatus.value = job.value.status;
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

const submitApplication = async (formData: { cover_letter?: string; proposed_rate?: number }) => {
  // Re-check eligibility immediately before submit
  await fetchRtwStatus();

  if (!canApply.value || !jobId.value) {
    applyError.value = 'You are no longer eligible to apply to this job.';
    return;
  }

  applyError.value = null;
  applySuccess.value = null;

  if (!formData.cover_letter || formData.cover_letter.length < 10) {
    applyError.value = 'Please add at least 10 characters to your cover letter.';
    return;
  }

  applySubmitting.value = true;
  try {
    await applicationsApi.createApplication({
      job_id: jobId.value,
      cover_letter: formData.cover_letter,
      proposed_rate: formData.proposed_rate
    });
    applySuccess.value = "Application submitted. We'll notify the employer.";
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

const updateJobStatus = async () => {
  if (!job.value || statusUpdating.value) return;

  statusUpdating.value = true;
  try {
    await jobsApi.updateJob(jobId.value, { status: jobStatus.value });

    await fetchJob();
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to update job status';
    jobStatus.value = job.value.status;
  } finally {
    statusUpdating.value = false;
  }
};

const deleteJob = async () => {
  if (!jobId.value || deleting.value) return;

  deleting.value = true;
  showDeleteDialog.value = false;
  try {
    await jobsApi.deleteJob(jobId.value);
    navigateTo('/jobs');
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to delete job';
  } finally {
    deleting.value = false;
  }
};

watch(jobId, () => {
  fetchJob();
  fetchApplications();
});

const onRtwVerified = () => {
  showRtwModal.value = false;
};

onMounted(() => {
  fetchRtwStatus();
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

.job-detail__status-control {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.job-detail__status-control label {
  font-weight: 600;
  font-size: var(--text-sm);
}

.job-detail__status-select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  font-size: var(--text-sm);
  cursor: pointer;
}

.job-detail__status-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.job-detail__status-updating {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.job-detail__delete-button {
  padding: var(--space-2) var(--space-4);
  background: var(--color-danger-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease;
}

.job-detail__delete-button:hover:not(:disabled) {
  background: var(--color-danger-700);
}

.job-detail__delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.rtw-gate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: center;
}

.rtw-gate__icon {
  margin: 0;
  font-size: 2rem;
}

.rtw-gate__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
}

.rtw-gate__body {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.rtw-gate__button {
  padding: var(--space-3) var(--space-5);
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background 150ms ease;
}

.rtw-gate__button:hover {
  background: var(--color-primary-700);
}
</style>
