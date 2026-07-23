<template>
  <section class="contract-detail">
    <NuxtLink class="contract-detail__back" to="/dashboard">← Back to dashboard</NuxtLink>

    <div v-if="loading">
      <LoadingSkeleton variant="block" height="200px" />
    </div>

    <EmptyState
      v-else-if="error"
      title="Contract not found"
      description="We were not able to fetch this contract. This contract may have been deleted or you don't have permission to view it."
      icon="⚠️"
    >
      <template #actions>
        <NuxtLink to="/contracts" class="empty-state__cta">View contracts</NuxtLink>
      </template>
    </EmptyState>

    <template v-else-if="contract">
      <header class="contract-detail__header">
        <div>
          <p class="contract-detail__eyebrow">Contract</p>
          <h1>{{ contract.job_title ?? 'Untitled Job' }}</h1>
        </div>
        <StatusPill :label="contractStatusLabel" :variant="contractStatusVariant" />
      </header>

      <div class="contract-detail__grid">
        <DataList title="Contract Details">
          <li>
            <span>Status</span>
            <strong>{{ contractStatusLabel }}</strong>
          </li>
          <li>
            <span>Employer</span>
            <strong>{{ contract.employer_first_name }} {{ contract.employer_last_name }}</strong>
          </li>
          <li>
            <span>Worker</span>
            <strong>{{ contract.worker_username || `${contract.worker_first_name} ${contract.worker_last_name}` }}</strong>
          </li>
          <li v-if="contract.worker_bio">
            <span>Bio</span>
            <strong>{{ contract.worker_bio }}</strong>
          </li>
          <li>
            <span>Created</span>
            <strong>{{ new Date(contract.created_at).toLocaleDateString() }}</strong>
          </li>
        </DataList>

      </div>



      <div v-if="actionError" class="contract-detail__error" role="alert">{{ actionError }}</div>

      <div v-if="showActions" class="contract-detail__actions" aria-label="Contract actions">
        <button
          v-if="isWorker && contract.status === 'active'"
          type="button"
          class="contract-detail__btn contract-detail__btn--primary"
          :disabled="actionLoading"
          :aria-busy="actionLoading"
          @click="handleMarkComplete"
        >
          Mark job as complete
        </button>

        <button
          v-if="isEmployer && contract.status === 'pending_review'"
          type="button"
          class="contract-detail__btn contract-detail__btn--success"
          :disabled="actionLoading"
          :aria-busy="actionLoading"
          @click="handleApprove"
        >
          Approve and release payment
        </button>

        <button
          v-if="isEmployer && contract.status === 'pending_review'"
          type="button"
          class="contract-detail__btn contract-detail__btn--danger"
          :disabled="actionLoading"
          :aria-busy="actionLoading"
          @click="handleReject"
        >
          Request changes
        </button>

        <button
          v-if="isEmployer && contract.status === 'completed' && contract.payout_status === 'pending'"
          type="button"
          class="contract-detail__btn contract-detail__btn--success"
          :disabled="actionLoading"
          :aria-busy="actionLoading"
          @click="handleReleasePayout"
        >
          Release payout
        </button>
      </div>
    </template>

  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

import { computed, onMounted, ref } from 'vue';
import { useRoute, useSupabaseUser } from '#imports';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import { useContracts } from '~/composables/useContracts';
import { usePayments } from '~/composables/usePayments';
import type { ContractWithDetailsInput, ContractStatus } from '~/schemas/contract';


const route = useRoute();
const user = useSupabaseUser();
const contractsApi = useContracts();
const paymentsApi = usePayments();

const contract = ref<ContractWithDetailsInput | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const actionLoading = ref(false);
const actionError = ref<string | null>(null);

const contractId = computed(() => route.params.id as string);
const isEmployer = computed(() => user.value?.id === contract.value?.employer_id);
const isWorker = computed(() => user.value?.id === contract.value?.worker_id);
const showActions = computed(() => {
  if (!contract.value) return false;
  const s = contract.value.status;
  if (isWorker.value && s === 'active') return true;
  if (isEmployer.value && s === 'pending_review') return true;
  if (isEmployer.value && s === 'completed' && contract.value.payout_status === 'pending') return true;
  return false;
});

const statusVariantMap: Record<ContractStatus, 'neutral' | 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  active: 'info',
  pending_review: 'warning',
  completed: 'success',
  cancelled: 'neutral'
};

const statusLabelMap: Record<ContractStatus, string> = {
  pending: 'Pending',
  active: 'In Progress',
  pending_review: 'Awaiting Approval',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const contractStatusVariant = computed(() =>
  contract.value ? statusVariantMap[contract.value.status] : 'neutral'
);
const contractStatusLabel = computed(() =>
  contract.value ? statusLabelMap[contract.value.status] : ''
);



const fetchContract = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await contractsApi.getContract(contractId.value);
    contract.value = response.contract as ContractWithDetailsInput;
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Could not load contract.';
  } finally {
    loading.value = false;
  }
};

const handleMarkComplete = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    const response = await contractsApi.markComplete(contractId.value);
    contract.value = response.contract as ContractWithDetailsInput;
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Failed to mark job as complete.';
  } finally {
    actionLoading.value = false;
  }
};

const handleApprove = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    const response = await contractsApi.approveCompletion(contractId.value);
    contract.value = response.contract as ContractWithDetailsInput;
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Failed to approve completion.';
  } finally {
    actionLoading.value = false;
  }
};

const handleReject = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    const response = await contractsApi.rejectCompletion(contractId.value);
    contract.value = response.contract as ContractWithDetailsInput;
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Failed to request changes.';
  } finally {
    actionLoading.value = false;
  }
};

const handleReleasePayout = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    await paymentsApi.processPayout({
      contract_id: contractId.value,
      idempotency_key: `payout-${contractId.value}-${Date.now()}`
    });
    await fetchContract();
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Failed to release payout.';
  } finally {
    actionLoading.value = false;
  }
};




onMounted(() => {
  fetchContract();
});
</script>

<style scoped>
.contract-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.contract-detail__back {
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
  text-decoration: none;
}

.contract-detail__back:hover {
  color: var(--color-text);
}

.contract-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.contract-detail__eyebrow {
  margin: 0;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.contract-detail__status-group {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.contract-detail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-5);
}

.contract-detail__txn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) 0;
}

.contract-detail__txn-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contract-detail__txn-type {
  font-weight: 500;
}

.contract-detail__txn-date {
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.contract-detail__txn-amount--credit {
  color: var(--color-success);
  font-weight: 700;
}

.contract-detail__txn-amount--debit {
  color: var(--color-text-muted);
  font-weight: 700;
}

.contract-detail__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.contract-detail__btn {
  border: none;
  border-radius: var(--radius-md);
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
}

.contract-detail__btn:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.contract-detail__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.contract-detail__btn--primary {
  background: var(--color-primary-600);
  color: white;
}

.contract-detail__btn--primary:hover:not(:disabled) {
  background: var(--color-primary-700);
}

.contract-detail__btn--success {
  background: var(--color-success);
  color: white;
}

.contract-detail__btn--success:hover:not(:disabled) {
  opacity: 0.9;
}

.contract-detail__btn--danger {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.contract-detail__btn--danger:hover:not(:disabled) {
  background: rgba(217, 48, 37, 0.08);
}

.contract-detail__error {
  background: rgba(217, 48, 37, 0.1);
  color: var(--color-danger);
  border: 1px solid rgba(217, 48, 37, 0.25);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  font-size: var(--text-sm);
}

.contract-detail__test-panel {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface-muted);
}

.contract-detail__test-panel summary {
  cursor: pointer;
  font-weight: 600;
}

.contract-detail__test-help {
  margin: var(--space-2) 0 var(--space-3);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
}

.contract-detail__test-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.contract-detail__test-meta {
  margin: var(--space-3) 0;
  font-size: var(--text-sm);
}

.contract-detail__test-result {
  margin: 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: var(--text-xs);
  overflow-x: auto;
}
</style>
