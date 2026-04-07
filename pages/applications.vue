<template>
  <section class="applications-page">
    <header class="applications-page__header">
      <div>
        <p class="applications-page__eyebrow">Your pipeline</p>
        <h1>Applications</h1>
      </div>
      <div class="applications-page__stats">
        <div class="applications-page__stat" v-for="stat in stats" :key="stat.label">
          <p>{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
        </div>
      </div>
    </header>

    <nav class="applications-page__filters" aria-label="Filter applications">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="applications-page__filter"
        :class="{ 'is-active': statusFilter === option.value }"
        @click="statusFilter = option.value as 'all' | ApplicationStatus"
      >
        {{ option.label }}
        <span>{{ option.count }}</span>
      </button>
    </nav>

    <DataList title="Applications" description="Latest activity across your jobs">
      <template v-if="loading">
        <li v-for="n in 4" :key="`applications-skeleton-${n}`">
          <LoadingSkeleton variant="block" height="160px" />
        </li>
      </template>

      <template v-else-if="error">
        <li>
          <EmptyState title="Could not load applications" :description="error" />
        </li>
      </template>

      <template v-else-if="!filteredApplications.length">
        <li>
          <EmptyState
            :title="role === 'employer' ? 'No applications received' : 'No applications sent'"
            :description="role === 'employer' ? 'Applications for your jobs will appear here.' : 'Apply to jobs to track your submissions here.'"
          />
        </li>
      </template>

      <template v-else>
        <li v-for="application in filteredApplications" :key="application.id">
          <ApplicationCard :application="application" :perspective="role" @withdraw="handleWithdraw" />
        </li>
      </template>
    </DataList>
  </section>
  <WithdrawModal
    v-if="withdrawTarget"
    :requires-reason="withdrawTarget.status === 'accepted'"
    @confirm="handleWithdrawConfirm"
    @cancel="withdrawTarget = null"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { computed, onMounted, ref, watch } from 'vue';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import ApplicationCard from '~/components/applications/ApplicationCard.vue';
import WithdrawModal from '~/components/applications/WithdrawModal.vue';
import { useApplications } from '~/composables/useApplications';
import { useActiveRole } from '~/composables/useActiveRole';
import type { ApplicationStatus, ApplicationWithDetails, WithdrawalReason } from '~/schemas/application';

const applicationsApi = useApplications();
const { role } = useActiveRole();

const applications = ref<ApplicationWithDetails[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const statusFilter = ref<'all' | ApplicationStatus>('all');

const statusLabels: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn'
};

const statusCounts = computed(() => {
  return applications.value.reduce(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, accepted: 0, rejected: 0, withdrawn: 0 } as Record<ApplicationStatus, number>
  );
});

const stats = computed(() => [
  { label: 'Total', value: applications.value.length.toString() },
  { label: 'Pending', value: statusCounts.value.pending.toString() },
  { label: 'Accepted', value: statusCounts.value.accepted.toString() },
  { label: 'Rejected', value: statusCounts.value.rejected.toString() }
]);

const filterOptions = computed(() => [
  { label: 'All', value: 'all', count: applications.value.length },
  ...Object.entries(statusLabels).map(([value, label]) => ({
    label,
    value: value as ApplicationStatus,
    count: statusCounts.value[value as ApplicationStatus]
  }))
]);

const filteredApplications = computed(() => {
  if (statusFilter.value === 'all') return applications.value;
  return applications.value.filter((application) => application.status === statusFilter.value);
});

const withdrawTarget = ref<ApplicationWithDetails | null>(null);

const handleWithdraw = (applicationId: string) => {
  const app = applications.value.find(a => a.id === applicationId);
  if (!app) return;
  if (app.status === 'accepted') {
    withdrawTarget.value = app;
  } else {
    doWithdraw(applicationId);
  }
};

const handleWithdrawConfirm = async (reason?: WithdrawalReason) => {
  if (!withdrawTarget.value) return;
  await doWithdraw(withdrawTarget.value.id, reason);
  withdrawTarget.value = null;
};

const doWithdraw = async (applicationId: string, reason?: WithdrawalReason) => {
  try {
    await applicationsApi.updateApplication(applicationId, {
      status: 'withdrawn',
      ...(reason ? { withdrawal_reason: reason } : {})
    });
    await fetchApplications();
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Could not withdraw application.';
  }
};

const fetchApplications = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await applicationsApi.listMyApplications(role.value);
    applications.value = response.applications ?? [];
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Something went wrong.';
  } finally {
    loading.value = false;
  }
};

watch(role, () => {
  fetchApplications();
});

onMounted(() => {
  fetchApplications();
});
</script>

<style scoped>
.applications-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.applications-page__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
}

.applications-page__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
  margin: 0;
}

.applications-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}

.applications-page__stat {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  background: var(--color-surface);
}

.applications-page__stat p {
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.applications-page__stat strong {
  font-size: var(--text-lg);
}

.applications-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.applications-page__filter {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 999px;
  padding: 6px 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.applications-page__filter span {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.applications-page__filter.is-active {
  background: var(--color-primary-600);
  border-color: transparent;
  color: white;
}

.applications-page__filter.is-active span {
  color: white;
}
</style>
