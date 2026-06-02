<template>
  <section class="dashboard-page">
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
              :description="role === 'employer' ? 'Jobs you create will be listed here. This list shows jobs you\'ve created. Post your first job to see it here.' : 'Jobs in your area will appear here. This list shows available jobs in your area. New opportunities appear as employers post them.'"
              :icon="ClipboardList"
            >
              <template #actions>
                <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="empty-state__cta">Post your first job</NuxtLink>
                <NuxtLink v-if="role === 'worker'" to="/jobs" class="empty-state__cta">Refresh</NuxtLink>
              </template>
            </EmptyState>
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
              :description="role === 'employer' ? 'Applications will show here as they arrive. Applications appear when workers apply to your posted jobs.' : 'Apply to jobs to see your submissions here. Your applications appear here after you submit them to job postings.'"
              icon="📝"
            >
              <template #actions>
                <NuxtLink v-if="role === 'employer'" to="/jobs/new" class="empty-state__cta">Post a job</NuxtLink>
                <NuxtLink v-if="role === 'worker'" to="/jobs" class="empty-state__cta">Find jobs</NuxtLink>
              </template>
            </EmptyState>
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
              description="Payments will appear here after you hire and pay a worker. Payment events show when you pay workers or receive payouts as a worker."
              :icon="CreditCard"
            >
              <template #actions>
                <NuxtLink v-if="role === 'employer'" to="/jobs" class="empty-state__cta">Post a job</NuxtLink>
                <NuxtLink v-if="role === 'worker'" to="/jobs" class="empty-state__cta">Find work</NuxtLink>
              </template>
            </EmptyState>
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
import StatusPill from '~/components/primitives/StatusPill.vue';
import type { PaymentEventInput } from '~/schemas/payment';
import { ClipboardList, CreditCard } from '@lucide/vue';

const { role } = useActiveRole();

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
    const totalApps = applications.value.length;
    const acceptedApps = applications.value.filter((app) => app.status === 'accepted').length;
    const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0;
    return [
      { title: 'Open jobs', value: openJobs.toString(), description: 'Active listings' },
      { title: 'Applications', value: totalApps.toString(), description: `${acceptanceRate}% accepted`, trend: { value: '↑ 2', label: 'from last week', variant: 'up' as const } },
      { title: 'Pending decisions', value: pendingApps.toString(), description: 'Requires attention' },
      { title: 'Pending payments', value: pendingPayments.toString(), description: 'This month' }
    ];
  } else {
    const pendingApps = applications.value.filter((app) => app.status === 'pending').length;
    const acceptedApps = applications.value.filter((app) => app.status === 'accepted').length;
    const totalApps = applications.value.length;
    const acceptanceRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0;
    return [
      { title: 'Applications sent', value: totalApps.toString(), description: 'This month' },
      { title: 'Pending', value: pendingApps.toString(), description: 'Awaiting response' },
      { title: 'Accepted', value: acceptedApps.toString(), description: `${acceptanceRate}% acceptance rate`, trend: { value: '↑ 1', label: 'from last week', variant: 'up' as const } },
      { title: 'Avg. rating', value: '4.8★', description: 'Based on reviews' }
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
  } catch (error) {
    console.error('Failed to load payments:', error);
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

onMounted(async () => {
  if (user.value) {
    const { data } = await supabase
      .from('profiles')
      .select('roles, onboarding_completed')
      .eq('id', user.value.id)
      .single();
    const profile = data as any;
    if (profile?.roles?.includes('worker') && !profile?.onboarding_completed) {
      navigateTo('/auth/onboarding');
      return;
    }
  }
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
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

.empty-state__cta {
  display: inline-block;
  padding: 10px 20px;
  background: var(--color-primary-600);
  color: white;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-weight: 600;
  transition: background 150ms ease;
}

.empty-state__cta:hover {
  background: var(--color-primary-700);
}

</style>
