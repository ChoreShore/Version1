<template>
  <section class="payments-page">
    <header class="payments-page__header">
      <div>
        <p class="payments-page__eyebrow">Ledger</p>
        <h1>Payments</h1>
      </div>
    </header>

    <nav class="payments-page__filters" aria-label="Filter payment events">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="payments-page__filter"
        :class="{ 'is-active': statusFilter === option.value }"
        @click="statusFilter = option.value as 'all' | PaymentStatus"
      >
        {{ option.label }}
        <span>{{ option.count }}</span>
      </button>
    </nav>

    <DataList title="Payment Events" description="Pending and processed payment activity">
      <template v-if="loading">
        <li v-for="n in 4" :key="`payments-skeleton-${n}`">
          <LoadingSkeleton variant="block" height="130px" />
        </li>
      </template>

      <template v-else-if="error">
        <li>
          <EmptyState 
            title="Unable to load payments" 
            :description="error" 
            explanation="There was a problem loading your payment history. This might be a temporary issue."
            :tips="['Check your internet connection', 'Try refreshing the page', 'Contact support if the issue persists']"
            icon="⚠️"
          >
            <template #actions>
              <button type="button" class="empty-state__cta" @click="fetchEvents">Retry</button>
            </template>
          </EmptyState>
        </li>
      </template>

      <template v-else-if="!filteredEvents.length">
        <li>
          <EmptyState
            title="No payment events"
            description="Payment activity will appear here after you pay or receive payouts."
            explanation="Your payment history shows all transactions made through the platform."
            :tips="['Complete jobs to generate payment events', 'Ensure payment methods are set up', 'Check payout settings for workers']"
            icon="💳"
          >
            <template #actions>
              <NuxtLink to="/jobs" class="empty-state__cta">Find work</NuxtLink>
            </template>
          </EmptyState>
        </li>
      </template>

      <template v-else>
        <li v-for="event in filteredEvents" :key="event.id">
          <article class="payment-event-card">
            <header class="payment-event-card__header">
              <div>
                <h3 class="payment-event-card__title">{{ event.job_title }}</h3>
                <p class="payment-event-card__meta">{{ describeEvent(event) }}</p>
              </div>
              <StatusPill :label="event.status" :variant="getStatusVariant(event.status)" />
            </header>

            <dl class="payment-event-card__details">
              <div>
                <dt>Amount</dt>
                <dd>{{ formatCurrency(event.amount, event.currency) }}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{{ formatDate(event.occurred_at) }}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{{ formatEventType(event.event_type) }}</dd>
              </div>
              <div v-if="event.counterparty_name">
                <dt>Counterparty</dt>
                <dd>{{ event.counterparty_name }}</dd>
              </div>
            </dl>
          </article>
        </li>
      </template>
    </DataList>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import { useAuth } from '~/composables/useAuth';
import { useActiveRole } from '~/composables/useActiveRole';
import { usePayments } from '~/composables/usePayments';
import type { PaymentEventInput, PaymentStatus } from '~/schemas/payment';

const { user } = useAuth();
const { role } = useActiveRole();
const paymentsApi = usePayments();

const loading = ref(true);
const error = ref<string | null>(null);
const events = ref<PaymentEventInput[]>([]);
const statusFilter = ref<'all' | PaymentStatus>('all');

const statusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  processed: 'Processed',
  failed: 'Failed',
  refunded: 'Refunded'
};

const statusCounts = computed(() => {
  return events.value.reduce(
    (acc, evt) => {
      acc[evt.status] = (acc[evt.status] ?? 0) + 1;
      return acc;
    },
    { pending: 0, processed: 0, failed: 0, refunded: 0 } as Record<PaymentStatus, number>
  );
});

const filterOptions = computed(() => [
  { label: 'All', value: 'all', count: events.value.length },
  ...Object.entries(statusLabels).map(([value, label]) => ({
    label,
    value: value as PaymentStatus,
    count: statusCounts.value[value as PaymentStatus]
  }))
]);

const filteredEvents = computed(() => {
  if (statusFilter.value === 'all') return events.value;
  return events.value.filter(evt => evt.status === statusFilter.value);
});

const fetchEvents = async () => {
  if (!user.value) {
    events.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await paymentsApi.listEvents(role.value);
    events.value = response.events ?? [];
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Failed to load payment events';
  } finally {
    loading.value = false;
  }
};

const getStatusVariant = (status: PaymentStatus): 'neutral' | 'info' | 'success' | 'warning' => {
  const variants: Record<PaymentStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
    pending: 'warning',
    processed: 'success',
    failed: 'neutral',
    refunded: 'info'
  };
  return variants[status] || 'neutral';
};

const formatEventType = (eventType: string) => {
  const labelMap: Record<string, string> = {
    employer_payment: 'Employer Payment',
    worker_payout: 'Worker Payout',
    refund: 'Refund'
  };
  return labelMap[eventType] || eventType;
};

const describeEvent = (event: PaymentEventInput) => {
  if (role.value === 'employer') {
    return event.event_type === 'worker_payout' ? 'Payout to worker' : 'Payment from employer account';
  }
  return event.event_type === 'worker_payout' ? 'Payout to your account' : 'Payment on your accepted application';
};

const formatDate = (value: string) => new Date(value).toLocaleString();
const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency || 'GBP'
  }).format(amount || 0);

watch([user, role], () => {
  fetchEvents();
}, { immediate: true });
</script>

<style scoped>
.payments-page {
  max-width: 920px;
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.payments-page__header h1 {
  margin: 0;
}

.payments-page__eyebrow {
  margin: 0 0 var(--space-1) 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.payments-page__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.payments-page__filter {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-pill);
  padding: 8px 12px;
  display: inline-flex;
  gap: 8px;
  cursor: pointer;
}

.payments-page__filter.is-active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: white;
}

.payment-event-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.payment-event-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.payment-event-card__title {
  margin: 0;
}

.payment-event-card__meta {
  margin: var(--space-1) 0 0 0;
  color: var(--color-text-muted);
}

.payment-event-card__details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.payment-event-card__details dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.payment-event-card__details dd {
  margin: 0;
  font-weight: 600;
}
</style>
