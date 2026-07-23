<template>
<NuxtLayout :name="user ? 'default' : 'public'">
  <section class="job-detail">
    <NuxtLink class="job-detail__back" :to="user ? '/jobs' : '/jobs/public'">← Back to jobs</NuxtLink>

    <div v-if="loading" class="job-detail__skeletons">
      <LoadingSkeleton variant="block" height="220px" />
      <LoadingSkeleton variant="block" height="160px" />
    </div>

    <EmptyState
      v-else-if="error"
      title="Job unavailable"
      :description="error"
      explanation="This job may have been deleted or you don't have permission to view it."
      :tips="['The job might have been removed by the employer', 'Check if you have the correct job URL', 'Browse available jobs instead']"
      :icon="AlertTriangle"
    >
      <template #actions>
        <NuxtLink :to="user ? '/jobs' : '/jobs/public'" class="empty-state__cta">Find jobs</NuxtLink>
      </template>
    </EmptyState>

    <template v-else-if="job">
      <div class="job-detail__layout">
        <!-- Main content -->
        <div class="job-detail__main">
          <div class="job-detail__header">
            <span class="job-detail__category-icon"><Brush :size="20" /></span>
            <div>
              <h1 class="job-detail__title">{{ job.title }}</h1>
              <div class="job-detail__meta-row">
                <span class="job-detail__location"><MapPin :size="14" class="location-icon" /> {{ publicData ? publicData.job.postcode_area : job.postcode }}</span>
                <span>·</span>
                <span>{{ postedAt }}</span>
                <span v-if="employerRating">· <Star :size="14" class="star-icon" /> {{ employerRating }} Employer Verified</span>
              </div>
            </div>
          </div>

          <div class="job-detail__rate">{{ budgetDisplay }}</div>

          <div class="job-detail__tags">
            <span v-if="job.is_recurring" class="tag">Recurring</span>
            <span v-if="job.is_urgent" class="tag tag--urgent">Immediate Start</span>
            <span v-if="job.budget_type === 'hourly'" class="tag">Flexible</span>
          </div>

          <p class="job-detail__description">{{ job.description }}</p>

          <!-- Public CTA buttons -->
          <div v-if="!user" class="job-detail__actions">
            <NuxtLink to="/auth/sign-up" class="btn btn--primary">Sign up to apply</NuxtLink>
            <button class="btn btn--secondary" @click="saveJob"><Heart :size="18" /></button>
            <button class="btn btn--secondary" @click="shareJob"><Link :size="18" /></button>
          </div>

          <!-- Worker apply panel -->
          <aside v-else-if="showApplyPanel" class="job-detail__apply">
            <ApplicationForm
              :job-id="jobId"
              :worker-application="workerApplication"
              :submitting="applySubmitting"
              :error="applyError"
              :success="applySuccess"
              :budget-type="job?.budget_type"
              :budget-amount="job?.budget_amount"
              :estimated-hours="job?.estimated_hours"
              @submit="submitApplication"
            />
          </aside>

          <!-- Send Offer (public view) -->
          <div v-if="!user" class="job-detail__offer job-detail__offer--cta">
            <h3><MessageSquare :size="20" class="section-icon" /> Want to send an offer?</h3>
            <p>Create a free account to propose your rate and message the employer directly.</p>
            <div class="offer-preview">
              <span class="offer-preview__label">Example offer you could send:</span>
              <blockquote class="offer-preview__quote">
                "Experienced cleaner, available immediately — £16/hr"
              </blockquote>
            </div>
            <NuxtLink to="/auth/sign-up" class="btn btn--primary btn--full">Sign up — it's free</NuxtLink>
            <div class="offer-tip">
              💡 Fair pay guidance applies. Travel distance, skill level and job duration should always be considered when making offers.
            </div>
          </div>

          <!-- Employer controls -->
          <div v-if="isEmployerOwner" class="job-detail__status-control">
            <label for="job-status">Job Status</label>
            <select id="job-status" v-model="jobStatus" :disabled="statusUpdating" @change="updateJobStatus" class="job-detail__status-select">
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="completed">Completed</option>
            </select>
            <span v-if="statusUpdating" class="job-detail__status-updating">Updating...</span>
            <button type="button" class="job-detail__delete-button" :disabled="deleting" @click="showDeleteDialog = true">
              {{ deleting ? 'Deleting...' : 'Delete Job' }}
            </button>
          </div>

          <!-- Employer applications -->
          <DataList v-if="isEmployerOwner" title="Applications" description="Applicants for this job">
            <template v-if="applicationsLoading">
              <li v-for="n in 3" :key="`job-app-${n}`"><LoadingSkeleton variant="block" height="140px" /></li>
            </template>
            <template v-else-if="!applications.length">
              <li>
                <EmptyState title="No applications yet" description="Applications appear here when workers apply. Share your job posting to attract more applicants." icon="📝" />
              </li>
            </template>
            <template v-else>
              <li v-for="application in applications" :key="application.id">
                <ApplicationCard :application="application" perspective="employer">
                  <template #actions>
                    <ApplicationActions v-if="isEmployerOwner" :application="application" :disabled="applicationUpdating[application.id]" @action="updateApplicationStatus" />
                  </template>
                </ApplicationCard>
              </li>
            </template>
          </DataList>
        </div>

        <!-- Sidebar -->
        <aside class="job-detail__sidebar">
          <!-- Employer card -->
          <div class="sidebar-card">
            <h4>Posted by</h4>
            <div class="employer-row">
              <div class="employer-avatar">
                <img v-if="employerPhoto" :src="employerPhoto" alt="" />
                <span v-else>{{ employerInitials }}</span>
              </div>
              <div>
                <strong>{{ employerName }}</strong>
                <div v-if="employerRating" class="employer-rating"><Star :size="14" class="star-icon" /> {{ employerRating }} rating</div>
                <div class="employer-stats">{{ totalJobsPosted }} jobs posted · {{ isVerified ? 'Verified ' : '' }}<Check v-if="isVerified" :size="12" class="check-icon" /></div>
              </div>
            </div>
            <NuxtLink v-if="employerUsername" :to="`/profile/${employerUsername}`" class="btn btn--secondary btn--full">View Profile</NuxtLink>
          </div>

          <!-- Job Insights -->
          <div class="sidebar-card">
            <h4><BarChart3 :size="18" class="section-icon" /> Job Insights</h4>
            <div class="insight-row">
              <span><Users :size="14" class="users-icon" /> {{ applicationCount }} applicants</span>
            </div>
          </div>

          <!-- Quick Apply -->
          <div v-if="!user" class="sidebar-card sidebar-card--highlight">
            <h4>⚡ Quick Apply</h4>
            <p>Apply instantly with your profile</p>
            <NuxtLink to="/auth/sign-up" class="btn btn--primary btn--full">Sign up to apply</NuxtLink>
          </div>

          <!-- More from employer -->
          <div v-if="otherJobs.length" class="sidebar-card">
            <h4>📋 More from this employer</h4>
            <ul class="other-jobs">
              <li v-for="oj in otherJobs" :key="oj.id">
                <NuxtLink :to="`/jobs/${oj.id}`">
                  <span class="other-jobs__title">{{ oj.title }}</span>
                  <span class="other-jobs__rate"> · {{ formatOtherBudget(oj) }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <!-- Similar jobs -->
      <div v-if="similarJobs.length" class="similar-jobs">
        <h3><Flame :size="20" class="section-icon" /> Similar jobs near you</h3>
        <ul class="similar-jobs__list">
          <li v-for="sj in similarJobs" :key="sj.id">
            <NuxtLink :to="`/jobs/${sj.id}`">
              <span class="similar-jobs__title">{{ sj.title }}</span>
              <span class="similar-jobs__meta"> · {{ sj.postcode_area }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

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
</NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false // layout is chosen dynamically via <NuxtLayout>
});
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useSupabaseUser, useRouter } from '#imports';
import { AlertTriangle, Brush, MapPin, Star, Heart, Link, MessageSquare, Users, BarChart3, Check, Flame, Zap } from '@lucide/vue';
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

const route = useRoute();
const router = useRouter();
const jobsApi = useJobs();
const applicationsApi = useApplications();
const user = useSupabaseUser();
const { role } = useActiveRole();

const showDeleteDialog = ref(false);
const deleting = ref(false);
const loading = ref(true);
const error = ref<string | null>(null);

const job = ref<JobWithDetailsInput | null>(null);
const publicData = ref<any>(null);
const applications = ref<ApplicationWithDetailsInput[]>([]);
const applicationsLoading = ref(true);
const applicationUpdating = ref<Record<string, boolean>>({});
const statusUpdating = ref(false);
const jobStatus = ref<JobStatus>('open');

const applySubmitting = ref(false);
const applyError = ref<string | null>(null);
const applySuccess = ref<string | null>(null);

const similarJobs = ref<any[]>([]);

const jobId = computed(() => route.params.id as string);
const isWorkerRole = computed(() => role.value === 'worker');
const isEmployerOwner = computed(() => !!user.value?.id && role.value === 'employer' && job.value?.employer_id === user.value.id);
const workerApplication = computed(() => applications.value.find((a) => a.worker_id === user.value?.id) ?? null);
const showApplyPanel = computed(() => isWorkerRole.value && job.value?.status === 'open');
const canApply = computed(() => !!showApplyPanel.value && !workerApplication.value && job.value?.employer_id !== user.value?.id);

// Public data getters
const employerName = computed(() => {
  if (publicData.value) return publicData.value.employer.display_name;
  if (job.value?.employer_first_name) return `${job.value.employer_first_name} ${job.value.employer_last_name ?? ''}`.trim();
  return 'Anonymous';
});
const employerPhoto = computed(() => publicData.value?.employer?.photo_url ?? null);
const employerInitials = computed(() => employerName.value.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase());
const employerRating = computed(() => publicData.value?.employer?.average_rating ?? null);
const totalJobsPosted = computed(() => publicData.value?.employer?.total_jobs_posted ?? 0);
const isVerified = computed(() => publicData.value?.employer?.is_verified ?? false);
const employerUsername = computed(() => publicData.value?.employer?.username ?? null);
const applicationCount = computed(() => publicData.value?.application_count ?? 0);
const otherJobs = computed(() => publicData.value?.other_jobs ?? []);
const postedAt = computed(() => publicData.value?.job?.posted_at_relative ?? '');

const budgetDisplay = computed(() => {
  const j = publicData.value?.job ?? job.value;
  if (!j) return '';
  return j.budget_type === 'hourly' ? `£${j.budget_amount}/hr` : `£${j.budget_amount.toLocaleString()}`;
});

const formatOtherBudget = (j: any) => j.budget_type === 'hourly' ? `£${j.budget_amount}/hr` : `£${j.budget_amount}`;

const fetchJob = async () => {
  loading.value = true;
  error.value = null;
  job.value = null;
  publicData.value = null;
  try {
    if (user.value) {
      const response = await jobsApi.getJob(jobId.value);
      job.value = response.job as JobWithDetailsInput;
      jobStatus.value = job.value.status;
    } else {
      const response = await jobsApi.getPublicJob(jobId.value);
      publicData.value = response;
      job.value = response.job;
      jobStatus.value = response.job.status;
      similarJobs.value = [];
      if (response.job.latitude && response.job.longitude) {
        try {
          const near = await jobsApi.findNearbyJobs(response.job.latitude, response.job.longitude, 10);
          similarJobs.value = (near.jobs || []).filter((j: any) => j.job_id !== jobId.value).slice(0, 3).map((j: any) => ({
            id: j.job_id,
            title: j.title,
            postcode_area: j.postcode_area
          }));
        } catch { /* ignore */ }
      }
    }
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'We could not load this job.';
  } finally {
    loading.value = false;
  }
};

const fetchApplications = async () => {
  if (!user.value) return;
  applicationsLoading.value = true;
  try {
    const response = await applicationsApi.getJobApplications(jobId.value);
    applications.value = response.applications ?? [];
  } finally {
    applicationsLoading.value = false;
  }
};

const submitApplication = async (formData: { cover_letter?: string; proposed_rate?: number }) => {
  if (!canApply.value || !jobId.value) { applyError.value = 'You are no longer eligible to apply to this job.'; return; }
  applyError.value = null; applySuccess.value = null;
  if (!formData.cover_letter || formData.cover_letter.length < 10) { applyError.value = 'Please add at least 10 characters to your cover letter.'; return; }
  applySubmitting.value = true;
  try {
    await applicationsApi.createApplication({ job_id: jobId.value, cover_letter: formData.cover_letter, proposed_rate: formData.proposed_rate });
    applySuccess.value = "Application submitted. We'll notify the employer.";
    await fetchApplications();
  } catch (err: any) { applyError.value = err?.data?.statusMessage || 'Unable to submit application.'; }
  finally { applySubmitting.value = false; }
};

const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
  applicationUpdating.value[applicationId] = true;
  try { await applicationsApi.updateApplication(applicationId, { status }); await fetchApplications(); }
  catch (err) { console.error(err); }
  finally { applicationUpdating.value[applicationId] = false; }
};

const updateJobStatus = async () => {
  if (!job.value || statusUpdating.value) return;
  statusUpdating.value = true;
  try { await jobsApi.updateJob(jobId.value, { status: jobStatus.value }); await fetchJob(); }
  catch (err: any) { error.value = err?.data?.statusMessage || 'Failed to update job status'; jobStatus.value = job.value.status; }
  finally { statusUpdating.value = false; }
};

const deleteJob = async () => {
  if (!jobId.value || deleting.value) return;
  deleting.value = true; showDeleteDialog.value = false;
  try { await jobsApi.deleteJob(jobId.value); navigateTo('/jobs'); }
  catch (err: any) { error.value = err?.data?.statusMessage || 'Failed to delete job'; }
  finally { deleting.value = false; }
};

const saveJob = () => alert('Sign in to save jobs');
const shareJob = () => {
  if (navigator.share) navigator.share({ title: job.value?.title ?? '', url: window.location.href });
  else navigator.clipboard.writeText(window.location.href);
};

watch(jobId, () => { fetchJob(); if (isEmployerOwner.value) fetchApplications(); });
onMounted(() => { fetchJob(); if (isEmployerOwner.value) fetchApplications(); });
</script>

<style scoped>
.job-detail { display: flex; flex-direction: column; gap: var(--space-5); max-width: 1100px; margin: 0 auto; padding: var(--space-5); }
.job-detail__back { text-decoration: none; color: var(--muted); font-weight: 600; }
.job-detail__layout { display: grid; grid-template-columns: 1fr 340px; gap: var(--space-6); }
@media (max-width: 840px) { .job-detail__layout { grid-template-columns: 1fr; } }

.job-detail__main { display: flex; flex-direction: column; gap: var(--space-5); }
.job-detail__header { display: flex; gap: var(--space-3); align-items: flex-start; }
.job-detail__category-icon { font-size: var(--text-2xl); line-height: 1; }
.job-detail__title { margin: 0; font-size: var(--text-2xl); font-weight: 700; }
.job-detail__meta-row { display: flex; gap: var(--space-2); align-items: center; color: var(--muted); font-size: var(--text-sm); margin-top: var(--space-1); flex-wrap: wrap; }
.job-detail__location { color: var(--muted); }
.job-detail__rate { font-size: var(--text-xl); font-weight: 700; }

.job-detail__tags { display: flex; gap: var(--space-2); flex-wrap: wrap; }
.tag { background: var(--hover); padding: var(--space-1) var(--space-3); border-radius: var(--radius-pill); font-size: var(--text-sm); font-weight: 600; }
.tag--urgent { background: var(--color-warning-light); color: var(--accent); }

.job-detail__description { margin: 0; color: var(--text); line-height: 1.6; }

.job-detail__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-weight: 600; font-size: var(--text-sm); text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1); cursor: pointer; border: none; transition: background 150ms ease; }
.btn--primary { background: var(--dark); color: white; }
.btn--primary:hover { background: var(--teal); }
.btn--secondary { background: var(--hover); color: var(--text); border: 1px solid var(--border); }
.btn--secondary:hover { background: var(--border); }
.btn--full { width: 100%; }

.job-detail__offer { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.job-detail__offer h3 { margin: 0; font-size: var(--text-lg); }
.job-detail__offer p { margin: 0; color: var(--muted); font-size: var(--text-sm); }
.job-detail__offer--cta { background: var(--color-primary-50); border-color: var(--color-primary-200); }
.offer-preview { background: var(--surface); border: 1px dashed var(--border); border-radius: var(--radius-md); padding: var(--space-3); }
.offer-preview__label { display: block; font-size: var(--text-xs); color: var(--muted); margin-bottom: var(--space-1); text-transform: uppercase; letter-spacing: 0.05em; }
.offer-preview__quote { margin: 0; font-size: var(--text-sm); color: var(--text); font-style: italic; line-height: 1.5; }
.offer-tip { background: #fffbeb; padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--text); }

.job-detail__status-control { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.job-detail__status-select { padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); background: white; font-size: var(--text-sm); cursor: pointer; }
.job-detail__delete-button { padding: var(--space-2) var(--space-4); background: var(--color-danger); color: white; border: none; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 600; cursor: pointer; }
.job-detail__delete-button:hover { opacity: 0.9; }

.job-detail__sidebar { display: flex; flex-direction: column; gap: var(--space-4); }
.sidebar-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }
.sidebar-card--highlight { background: #fffbeb; border-color: #fde68a; }
.sidebar-card h4 { margin: 0; font-size: var(--text-base); font-weight: 700; }

.employer-row { display: flex; gap: var(--space-3); align-items: center; }
.employer-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--hover); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--muted); overflow: hidden; flex-shrink: 0; }
.employer-avatar img { width: 100%; height: 100%; object-fit: cover; }
.employer-rating { font-size: var(--text-sm); color: var(--muted); }
.employer-stats { font-size: var(--text-sm); color: var(--muted); }

.insight-row { font-size: var(--text-sm); color: var(--text); }

.other-jobs, .similar-jobs__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
.other-jobs a, .similar-jobs__list a { text-decoration: none; color: var(--text); font-size: var(--text-sm); display: flex; flex-wrap: wrap; }
.other-jobs__title, .similar-jobs__title { font-weight: 600; }
.other-jobs__rate, .similar-jobs__meta { color: var(--muted); }

.similar-jobs { margin-top: var(--space-4); }
.similar-jobs h3 { margin: 0 0 var(--space-4); font-size: var(--text-lg); display: flex; align-items: center; }

.job-detail__category-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
}

.location-icon,
.star-icon,
.users-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
}

.check-icon {
  display: inline-flex;
  align-items: center;
  color: var(--color-success-600);
}

.section-icon {
  display: inline-flex;
  align-items: center;
  margin-right: var(--space-2);
}

.job-detail__skeletons { display: flex; flex-direction: column; gap: var(--space-4); }
</style>
