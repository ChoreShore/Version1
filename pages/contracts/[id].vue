<template>
  <section class="contract-detail">
    <NuxtLink class="contract-detail__back" to="/dashboard">← Back to dashboard</NuxtLink>

    <div v-if="loading">
      <LoadingSkeleton variant="block" height="200px" />
    </div>

    <EmptyState v-else-if="error" title="Contract unavailable" :description="error" />

    <template v-else-if="contract">
      <header class="contract-detail__header">
        <div>
          <p class="contract-detail__eyebrow">Contract</p>
          <h1>{{ contract.job_title ?? 'Untitled Job' }}</h1>
        </div>
        <div class="contract-detail__status-group">
          <StatusPill :label="contractStatusLabel" :variant="contractStatusVariant" />
          <PaymentStatusBadge
            v-if="contract.escrow_payment"
            :status="contract.escrow_payment.status"
          />
        </div>
      </header>

      <div class="contract-detail__grid">
        <DataList title="Contract Details">
          <li>
            <span>Status</span>
            <strong>{{ contractStatusLabel }}</strong>
          </li>
          <li v-if="contract.escrow_payment">
            <span>Job Amount (worker receives)</span>
            <strong>£{{ contract.escrow_payment.worker_payout_amount.toFixed(2) }}</strong>
          </li>
          <li v-if="contract.escrow_payment">
            <span>Platform Fee</span>
            <strong>£{{ contract.escrow_payment.platform_fee.toFixed(2) }}</strong>
          </li>
          <li v-if="contract.escrow_payment">
            <span>Total Charged</span>
            <strong>£{{ contract.escrow_payment.total_amount.toFixed(2) }}</strong>
          </li>
          <li>
            <span>Employer</span>
            <strong>{{ contract.employer_first_name }} {{ contract.employer_last_name }}</strong>
          </li>
          <li>
            <span>Worker</span>
            <strong>{{ contract.worker_first_name }} {{ contract.worker_last_name }}</strong>
          </li>
          <li>
            <span>Created</span>
            <strong>{{ new Date(contract.created_at).toLocaleDateString() }}</strong>
          </li>
        </DataList>

        <DataList title="Transactions" description="All financial movements for this contract">
          <template v-if="!contract.transactions?.length">
            <li>
              <EmptyState title="No transactions yet" description="Transactions will appear here after payment." />
            </li>
          </template>
          <template v-else>
            <li v-for="txn in contract.transactions" :key="txn.id" class="contract-detail__txn">
              <div class="contract-detail__txn-info">
                <span class="contract-detail__txn-type">{{ txnLabel(txn.transaction_type) }}</span>
                <span class="contract-detail__txn-date">{{ new Date(txn.created_at).toLocaleDateString() }}</span>
              </div>
              <strong :class="`contract-detail__txn-amount--${txnAmountClass(txn.transaction_type)}`">
                {{ txnSign(txn.transaction_type) }}£{{ txn.amount.toFixed(2) }}
              </strong>
            </li>
          </template>
        </DataList>
      </div>

      <div v-if="isEmployer" class="contract-detail__actions">
        <button
          v-if="contract.status === 'pending' && !contract.escrow_payment"
          type="button"
          class="contract-detail__btn contract-detail__btn--primary"
          :disabled="actionLoading"
          @click="showPayModal = true"
        >
          Pay to Activate (£{{ pendingTotalAmount }})
        </button>

        <button
          v-if="contract.status === 'active'"
          type="button"
          class="contract-detail__btn contract-detail__btn--success"
          :disabled="actionLoading"
          @click="handleRelease"
        >
          {{ actionLoading ? 'Processing...' : 'Mark Complete & Release Funds' }}
        </button>

        <button
          v-if="['pending', 'active'].includes(contract.status)"
          type="button"
          class="contract-detail__btn contract-detail__btn--danger"
          :disabled="actionLoading"
          @click="handleRefund"
        >
          {{ actionLoading ? 'Processing...' : 'Cancel & Refund' }}
        </button>
      </div>

      <div v-if="actionError" class="contract-detail__error">{{ actionError }}</div>
    </template>

    <EscrowPaymentModal
      v-if="showPayModal && contract && pendingFees"
      :contract-id="contract.id"
      :fees="pendingFees"
      @confirmed="onPaymentConfirmed"
      @cancel="showPayModal = false"
    />
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
import PaymentStatusBadge from '~/components/payments/PaymentStatusBadge.vue';
import EscrowPaymentModal from '~/components/payments/EscrowPaymentModal.vue';
import { useContracts } from '~/composables/useContracts';
import { usePayments } from '~/composables/usePayments';
import type { ContractWithDetailsInput, ContractStatus } from '~/schemas/contract';
import type { FeeCalculation } from '~/schemas/payment';

const PLATFORM_FEE_RATE = 0.15;

function calculateFees(jobAmount: number): FeeCalculation {
  const platform_fee_amount = Math.round(jobAmount * PLATFORM_FEE_RATE * 100) / 100;
  return {
    job_amount: jobAmount,
    platform_fee_rate: PLATFORM_FEE_RATE,
    platform_fee_amount,
    total_amount: Math.round((jobAmount + platform_fee_amount) * 100) / 100,
    worker_payout_amount: jobAmount
  };
}

const route = useRoute();
const user = useSupabaseUser();
const contractsApi = useContracts();
const paymentsApi = usePayments();

const contract = ref<ContractWithDetailsInput | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const actionLoading = ref(false);
const actionError = ref<string | null>(null);
const showPayModal = ref(false);

const contractId = computed(() => route.params.id as string);
const isEmployer = computed(() => user.value?.id === contract.value?.employer_id);

const statusVariantMap: Record<ContractStatus, 'neutral' | 'warning' | 'success' | 'info'> = {
  pending: 'warning',
  active: 'info',
  completed: 'success',
  cancelled: 'neutral'
};

const statusLabelMap: Record<ContractStatus, string> = {
  pending: 'Awaiting Payment',
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const contractStatusVariant = computed(() =>
  contract.value ? statusVariantMap[contract.value.status] : 'neutral'
);
const contractStatusLabel = computed(() =>
  contract.value ? statusLabelMap[contract.value.status] : ''
);

const pendingFees = computed((): FeeCalculation | null => {
  if (!contract.value) return null;
  if (contract.value.escrow_payment) {
    return {
      job_amount: contract.value.escrow_payment.worker_payout_amount,
      platform_fee_rate: PLATFORM_FEE_RATE,
      platform_fee_amount: contract.value.escrow_payment.platform_fee,
      total_amount: contract.value.escrow_payment.total_amount,
      worker_payout_amount: contract.value.escrow_payment.worker_payout_amount
    };
  }
  if (contract.value.job_budget_amount) {
    return calculateFees(contract.value.job_budget_amount);
  }
  return null;
});

const pendingTotalAmount = computed(() => pendingFees.value?.total_amount.toFixed(2) ?? '—');

const txnLabel = (type: string) => {
  const labels: Record<string, string> = {
    deposit: 'Payment',
    release: 'Payout to worker',
    refund: 'Refund',
    fee: 'Platform fee'
  };
  return labels[type] ?? type;
};

const txnSign = (type: string) => (type === 'refund' || type === 'release' ? '-' : '+');
const txnAmountClass = (type: string) =>
  type === 'refund' || type === 'release' ? 'debit' : 'credit';

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

const onPaymentConfirmed = async () => {
  showPayModal.value = false;
  await fetchContract();
};

const handleRelease = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    await paymentsApi.releaseFunds(contractId.value);
    await fetchContract();
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Could not release funds.';
  } finally {
    actionLoading.value = false;
  }
};

const handleRefund = async () => {
  actionLoading.value = true;
  actionError.value = null;
  try {
    await paymentsApi.refundEscrow(contractId.value);
    await fetchContract();
  } catch (err: any) {
    actionError.value = err?.data?.statusMessage || 'Could not process refund.';
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
</style>
