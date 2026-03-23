<template>
  <section class="jobs-page">
    <header class="jobs-page__header">
      <div>
        <p class="jobs-page__eyebrow">{{ role === 'employer' ? 'Manage work' : 'Find work' }}</p>
        <h1>Jobs</h1>
        <p>{{ role === 'employer' ? 'Track and manage every job you\'ve posted.' : 'Browse and apply to available jobs.' }}</p>
      </div>
      <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="jobs-page__cta">Post a job</NuxtLink>
    </header>

    <div v-if="jobsLoading" class="jobs-page__grid">
      <LoadingSkeleton v-for="n in 4" :key="`job-skeleton-${n}`" variant="block" height="180px" />
    </div>

    <EmptyState
      v-else-if="!filteredJobs.length"
      :title="role === 'employer' ? 'No jobs yet' : 'No jobs available'"
      :description="role === 'employer' ? 'Post your first job to see it here.' : 'Check back later for new job opportunities.'"
    >
      <template #actions>
        <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="jobs-page__cta">Post a job</NuxtLink>
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
import { useSupabaseUser } from '#imports';

const { role } = useActiveRole();
const user = useSupabaseUser();
const jobs = ref<any[]>([]);
const jobsLoading = ref(true);
const myApplications = ref<any[]>([]);

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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
</style>
