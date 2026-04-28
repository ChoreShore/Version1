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

      <DataList title="Payments" description="Recent payment activity">
        <template v-if="paymentsLoading">
          <li v-for="n in 2" :key="`pay-skeleton-${n}`">
            <LoadingSkeleton variant="block" height="100px" />
          </li>
        </template>
        <template v-else-if="!paymentEvents.length">
          <li>
            <EmptyState
              title="No payment activity"
              description="Payments will appear here after you hire and pay a worker."
            />
          </li>
        </template>
        <template v-else>
          <li v-for="event in paymentEvents.slice(0, 3)" :key="event.id">
            <article class="dashboard-payment-card">
              <header class="dashboard-payment-card__header">
                <div>
                  <h4 class="dashboard-payment-card__title">{{ event.job_title }}</h4>
                  <p class="dashboard-payment-card__meta">{{ formatEventType(event.event_type) }}</p>
                </div>
                <StatusPill :label="event.status" :variant="getStatusVariant(event.status)" />
              </header>
              <p class="dashboard-payment-card__amount">{{ formatCurrency(event.amount, event.currency) }}</p>
            </article>
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
import { usePayments } from '~/composables/usePayments';
import { useActiveRole } from '~/composables/useActiveRole';
import { useRtw } from '~/composables/useRtw';
import RtwVerificationModal from '~/components/profile/RtwVerificationModal.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import type { PaymentEventInput } from '~/schemas/payment';

const { role } = useActiveRole();
const { isRtwRequired, fetchRtwStatus } = useRtw();
const showRtwModal = ref(false);

watch(isRtwRequired, (required) => {
  if (required) showRtwModal.value = true;
}, { immediate: true });

const jobs = ref<any[]>([]);
const applications = ref<any[]>([]);
const paymentEvents = ref<PaymentEventInput[]>([]);
const jobsLoading = ref(true);
const applicationsLoading = ref(true);
const paymentsLoading = ref(true);

const user = useSupabaseUser();
const supabase = useSupabaseClient() as any;

const stats = computed(() => {
  if (role.value === 'employer') {
    const openJobs = jobs.value.filter((job) => job.status === 'open').length;
    const pendingApps = applications.value.filter((app) => app.status === 'pending').length;
    const pendingPayments = paymentEvents.value.filter((evt) => evt.status === 'pending').length;
    return [
      { title: 'Open jobs', value: openJobs.toString() },
      { title: 'Applications', value: applications.value.length.toString() },
      { title: 'Pending decisions', value: pendingApps.toString() },
      { title: 'Pending payments', value: pendingPayments.toString() }
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

const loadPayments = async () => {
  paymentsLoading.value = true;
  try {
    const response = await usePayments().listEvents(role.value);
    paymentEvents.value = response.events ?? [];
  } catch {
    paymentEvents.value = [];
  } finally {
    paymentsLoading.value = false;
  }
};

const loadData = () => {
  loadJobs();
  loadApplications();
  loadPayments();
};

watch(role, () => {
  loadData();
});

onMounted(() => {
  fetchRtwStatus();
  loadData();
});

const getStatusVariant = (status: string): 'neutral' | 'info' | 'success' | 'warning' => {
  const map: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
    pending: 'warning',
    processed: 'success',
    failed: 'neutral',
    refunded: 'info'
  };
  return map[status] || 'neutral';
};

const formatEventType = (eventType: string) => {
  const map: Record<string, string> = {
    employer_payment: 'Employer Payment',
    worker_payout: 'Worker Payout',
    refund: 'Refund'
  };
  return map[eventType] || eventType;
};

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(amount || 0);

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

.dashboard-payment-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dashboard-payment-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.dashboard-payment-card__title {
  margin: 0;
  font-size: var(--text-sm);
}

.dashboard-payment-card__meta {
  margin: var(--space-1) 0 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.dashboard-payment-card__amount {
  margin: 0;
  font-weight: 700;
  font-size: var(--text-lg);
}

</style>
