<template>
  <section class="dashboard-page">
    <RtwVerificationModal v-if="showRtwModal" @verified="onRtwVerified" @close="showRtwModal = false" />
    <OverviewStats :stats="stats" />

    <div class="dashboard-page__grid">
      <DataList 
        :title="role === 'employer' ? 'Recent Jobs' : 'Available Jobs'"
        :description="role === 'employer' ? 'Latest jobs you posted' : 'Latest job opportunities'"
      >
        <template v-if="jobsLoading">
          <li v-for="n in 3" :key="`job-skeleton-${n}`">
            <LoadingSkeleton variant="block" height="140px" />
          </li>
        </template>
        <template v-else-if="!jobs.length">
          <li>
            <EmptyState 
              :title="role === 'employer' ? 'No jobs posted yet' : 'No jobs available'" 
              :description="role === 'employer' ? 'Create your first job posting to start hiring.' : 'Check back later for new opportunities.'" 
            />
          </li>
        </template>
        <template v-else>
          <li v-for="job in jobs" :key="job.id">
            <JobCard :job="job" />
          </li>
        </template>
      </DataList>

      <DataList title="Applications" description="Latest applications">
        <template v-if="applicationsLoading">
          <li v-for="n in 3" :key="`app-skeleton-${n}`">
            <LoadingSkeleton variant="block" height="140px" />
          </li>
        </template>
        <template v-else-if="!applications.length">
          <li>
            <EmptyState 
              :title="role === 'employer' ? 'No applications received' : 'No applications sent'" 
              :description="role === 'employer' ? 'Applications will show here as they arrive.' : 'Apply to jobs to see your submissions here.'" 
            />
          </li>
        </template>
        <template v-else>
          <li v-for="application in applications" :key="application.id">
            <ApplicationCard :application="application" :perspective="role" />
          </li>
        </template>
      </DataList>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { computed, onActivated, onMounted, ref, watch } from 'vue';
import OverviewStats from '~/components/dashboard/OverviewStats.vue';
import JobCard from '~/components/jobs/JobCard.vue';
import ApplicationCard from '~/components/applications/ApplicationCard.vue';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import { useJobs } from '~/composables/useJobs';
import { useApplications } from '~/composables/useApplications';
import { useActiveRole } from '~/composables/useActiveRole';
import { useRtw } from '~/composables/useRtw';
import RtwVerificationModal from '~/components/profile/RtwVerificationModal.vue';

const { role } = useActiveRole();
const { isRtwRequired, fetchRtwStatus } = useRtw();
const showRtwModal = ref(false);

watch(isRtwRequired, (required) => {
  if (required) showRtwModal.value = true;
}, { immediate: true });

const jobs = ref<any[]>([]);
const applications = ref<any[]>([]);
const jobsLoading = ref(true);
const applicationsLoading = ref(true);

const stats = computed(() => {
  if (role.value === 'employer') {
    const openJobs = jobs.value.filter((job) => job.status === 'open').length;
    const pendingApps = applications.value.filter((app) => app.status === 'pending').length;
    return [
      { title: 'Open jobs', value: openJobs.toString() },
      { title: 'Applications', value: applications.value.length.toString() },
      { title: 'Pending decisions', value: pendingApps.toString() },
      { title: 'Avg. rating', value: '4.8★' }
    ];
  } else {
    const pendingApps = applications.value.filter((app) => app.status === 'pending').length;
    const acceptedApps = applications.value.filter((app) => app.status === 'accepted').length;
    return [
      { title: 'Applications sent', value: applications.value.length.toString() },
      { title: 'Pending', value: pendingApps.toString() },
      { title: 'Accepted', value: acceptedApps.toString() },
      { title: 'Avg. rating', value: '4.8★' }
    ];
  }
});

const loadJobs = async () => {
  jobsLoading.value = true;
  try {
    const query = role.value === 'employer' ? { scope: 'mine' as const, role: role.value } : { role: role.value };
    const response = await useJobs().listJobs(query);
    jobs.value = (response.jobs ?? []) as any[];
  } finally {
    jobsLoading.value = false;
  }
};

const loadApplications = async () => {
  applicationsLoading.value = true;
  try {
    const response = await useApplications().listMyApplications(role.value);
    applications.value = response.applications ?? [];
  } finally {
    applicationsLoading.value = false;
  }
};

const loadData = () => {
  loadJobs();
  loadApplications();
};

watch(role, () => {
  loadData();
});

onMounted(() => {
  fetchRtwStatus();
  loadData();
});

const onRtwVerified = () => {
  showRtwModal.value = false;
  loadData();
};

// Refresh data when navigating back to dashboard
onActivated(() => {
  loadData();
});
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.dashboard-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-5);
}
</style>
