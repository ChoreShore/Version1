<template>
  <section class="jobs-page">
    <header class="jobs-page__header">
      <div>
        <p class="jobs-page__eyebrow">{{ role === 'employer' ? 'Manage work' : 'Find work' }}</p>
        <h1>Jobs</h1>
        <p>{{ role === 'employer' ? 'Track and manage every job you\'ve posted.' : 'Browse and apply to available jobs.' }}</p>
      </div>
      <div class="jobs-page__header-actions">
        <button
          v-if="role === 'worker'"
          type="button"
          class="jobs-page__location-btn"
          :disabled="geoLoading"
          @click="handleFindNearby"
        >
          {{ geoLoading ? 'Getting location...' : 'Find jobs near me' }}
        </button>
        <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="jobs-page__cta">Post a job</NuxtLink>
      </div>
    </header>

    <div v-if="geoError" class="jobs-page__geo-error">
      <p>{{ geoError }}</p>
      <button type="button" class="jobs-page__retry-btn" @click="handleFindNearby">Retry</button>
    </div>

    <div v-if="isNearbyMode" class="jobs-page__nearby-banner">
      <p>Showing jobs within 10 km of your location</p>
      <button type="button" class="jobs-page__clear-btn" @click="loadJobs">Show all jobs</button>
    </div>

    <div v-if="jobsLoading" class="jobs-page__grid">
      <LoadingSkeleton v-for="n in 4" :key="`job-skeleton-${n}`" variant="block" height="180px" />
    </div>

    <EmptyState
      v-else-if="!filteredJobs.length"
      :title="role === 'employer' ? 'No jobs yet' : 'No jobs available'"
      :description="role === 'employer' ? 'Post your first job to see it here.' : 'Check back later for new job opportunities.'"
      :explanation="role === 'employer' ? 'Jobs you create will appear in this list. Start by posting your first job.' : 'Available jobs matching your criteria will appear here. Try adjusting filters or check back later.'"
      :tips="role === 'employer' ? ['Be specific about the work needed', 'Set a fair budget to attract quality workers', 'Include location for local job matching'] : ['Use location filter to find nearby jobs', 'Filter by category to find relevant work', 'Apply to jobs that match your skills']"
      icon="📋"
    >
      <template #actions>
        <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="empty-state__cta">Post a job</NuxtLink>
        <NuxtLink v-if="role === 'worker'" to="/jobs" class="empty-state__cta">Refresh jobs</NuxtLink>
      </template>
    </EmptyState>

    <div v-else class="jobs-page__grid">
      <JobCard v-for="job in filteredJobs" :key="job.id" :job="job" />
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { onMounted, ref, watch, computed } from 'vue';
import JobCard from '~/components/jobs/JobCard.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import { useJobs } from '~/composables/useJobs';
import { useApplications } from '~/composables/useApplications';
import { useActiveRole } from '~/composables/useActiveRole';
import { useGeolocation } from '~/composables/useGeolocation';
import { useSupabaseUser } from '#imports';

const { role } = useActiveRole();
const user = useSupabaseUser();
const jobs = ref<any[]>([]);
const jobsLoading = ref(true);
const myApplications = ref<any[]>([]);
const geoError = ref<string | null>(null);
const geoLoading = ref(false);
const isNearbyMode = ref(false);

const appliedJobIds = computed(() => {
  return new Set(myApplications.value.map(app => app.job_id));
});

const filteredJobs = computed(() => {
  let filtered = jobs.value;

  if (role.value === 'worker' && user.value?.id) {
    filtered = filtered.filter((job) => job.employer_id !== user.value?.id);
  }

  return filtered.map(job => ({
    ...job,
    has_applied: appliedJobIds.value.has(job.id)
  }));
});

const handleFindNearby = async () => {
  geoError.value = null;
  geoLoading.value = true;
  isNearbyMode.value = false;

  try {
    const geo = useGeolocation();
    await geo.getCurrentPosition();

    if (geo.state.value.error) {
      geoError.value = geo.state.value.error;
      return;
    }

    if (!geo.state.value.latitude || !geo.state.value.longitude) {
      geoError.value = 'Could not retrieve your location. Please try again.';
      return;
    }

    isNearbyMode.value = true;
    jobsLoading.value = true;

    const response = await useJobs().findNearbyJobs(
      geo.state.value.latitude,
      geo.state.value.longitude,
      10
    );

    // Map nearby results to full job details with distance
    const nearbyJobIds = (response.jobs ?? []).map((j: any) => j.job_id);
    const distances = new Map((response.jobs ?? []).map((j: any) => [j.job_id, j.distance_km]));

    if (nearbyJobIds.length > 0) {
      // Fetch full job details for nearby jobs
      const fullJobsResponse = await useJobs().listJobs({ role: role.value });
      const allJobs = (fullJobsResponse.jobs ?? []) as any[];
      jobs.value = allJobs
        .filter((job) => nearbyJobIds.includes(job.id))
        .map((job) => ({
          ...job,
          distance_km: distances.get(job.id) ?? 0
        }));
    } else {
      jobs.value = [];
    }
  } catch (error: any) {
    geoError.value = error?.data?.statusMessage || 'Failed to find nearby jobs. Please try again.';
  } finally {
    jobsLoading.value = false;
    geoLoading.value = false;
  }
};

const loadApplications = async () => {
  if (role.value === 'worker' && user.value) {
    try {
      const response = await useApplications().listMyApplications('worker');
      myApplications.value = response.applications ?? [];
    } catch (error) {
      console.error('Failed to load applications:', error);
      myApplications.value = [];
    }
  } else {
    myApplications.value = [];
  }
};

const loadJobs = async () => {
  jobsLoading.value = true;
  myApplications.value = [];
  isNearbyMode.value = false;
  geoError.value = null;

  try {
    const query = role.value === 'employer' ? { scope: 'mine' as const, role: role.value } : { role: role.value };
    const response = await useJobs().listJobs(query);
    jobs.value = (response.jobs ?? []) as any[];
  } finally {
    jobsLoading.value = false;
  }
  
  // Load applications after jobs are loaded and rendered
  if (role.value === 'worker') {
    await loadApplications();
  }
};

watch(role, () => {
  loadJobs();
});

onMounted(loadJobs);
</script>

<style scoped>
.jobs-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.jobs-page__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: center;
}

.jobs-page__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.jobs-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.jobs-page__cta {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 10px 20px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  display: inline-block;
}

.jobs-page__cta:hover {
  background: var(--color-surface-muted);
}

.jobs-page__header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.jobs-page__location-btn {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 10px 20px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  display: inline-block;
  cursor: pointer;
  font: inherit;
}

.jobs-page__location-btn:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.jobs-page__location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.jobs-page__geo-error {
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.jobs-page__geo-error p {
  margin: 0;
  color: var(--color-danger-700);
}

.jobs-page__retry-btn {
  background: var(--color-danger-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.jobs-page__retry-btn:hover {
  background: var(--color-danger-700);
}

.jobs-page__nearby-banner {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.jobs-page__nearby-banner p {
  margin: 0;
  color: var(--color-primary-700);
}

.jobs-page__clear-btn {
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.jobs-page__clear-btn:hover {
  background: var(--color-primary-700);
}

@media (max-width: 768px) {
  .jobs-page__header-actions {
    flex-direction: column;
    width: 100%;
  }

  .jobs-page__nearby-banner,
  .jobs-page__geo-error {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
