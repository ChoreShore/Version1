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
          <ApplicationForm
            :job-id="jobId"
            :worker-application="workerApplication"
            :submitting="applySubmitting"
            :error="applyError"
            :success="applySuccess"
            @submit="submitApplication"
          />
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

const submitApplication = async (formData: { cover_letter: string; proposed_rate?: number }) => {
  if (!canApply.value || !jobId.value) return;
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
