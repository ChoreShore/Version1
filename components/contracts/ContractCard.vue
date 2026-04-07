<template>
  <article class="contract-card">
    <header class="contract-card__header">
      <div>
        <p class="contract-card__eyebrow">Contract</p>
        <h3 class="contract-card__title">
          <NuxtLink :to="`/contracts/${contract.id}`">{{ contract.job_title ?? 'Untitled Job' }}</NuxtLink>
        </h3>
      </div>
      <div class="contract-card__badges">
        <StatusPill :label="contractStatusLabel" :variant="contractStatusVariant" />
        <PaymentStatusBadge v-if="contract.escrow_payment" :status="contract.escrow_payment.status" />
      </div>
    </header>

    <dl class="contract-card__meta">
      <div v-if="contract.escrow_payment">
        <dt>Job amount</dt>
        <dd>£{{ contract.escrow_payment.worker_payout_amount.toFixed(2) }}</dd>
      </div>
      <div v-if="contract.escrow_payment">
        <dt>Total paid</dt>
        <dd>£{{ contract.escrow_payment.total_amount.toFixed(2) }}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{{ createdAt }}</dd>
      </div>
    </dl>

    <footer v-if="showActions" class="contract-card__footer">
      <slot name="actions" />
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContractWithDetailsInput, ContractStatus } from '~/schemas/contract';
import StatusPill from '~/components/primitives/StatusPill.vue';
import PaymentStatusBadge from '~/components/payments/PaymentStatusBadge.vue';

const props = defineProps<{ contract: ContractWithDetailsInput }>();

const contractStatusVariantMap: Record<ContractStatus, 'neutral' | 'warning' | 'success' | 'info' | 'danger'> = {
  pending: 'warning',
  active: 'info',
  completed: 'success',
  cancelled: 'neutral'
};

const contractStatusLabelMap: Record<ContractStatus, string> = {
  pending: 'Awaiting Payment',
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const contractStatusVariant = computed(() => contractStatusVariantMap[props.contract.status]);
const contractStatusLabel = computed(() => contractStatusLabelMap[props.contract.status]);
const createdAt = computed(() => new Date(props.contract.created_at).toLocaleDateString());
const showActions = computed(() => !!useSlots().actions);
</script>

<style scoped>
.contract-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.contract-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
}

.contract-card__badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: center;
}

.contract-card__eyebrow {
  margin: 0;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.contract-card__title {
  margin: 0;
  font-size: var(--text-lg);
}

.contract-card__title a {
  color: inherit;
  text-decoration: none;
}

.contract-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.contract-card__meta dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.contract-card__meta dd {
  margin: 0;
  font-weight: 600;
}

.contract-card__footer {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
