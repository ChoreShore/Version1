<template>
  <span class="payment-status-badge" :class="`payment-status-badge--${variant}`">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EscrowStatus } from '~/schemas/contract';

const props = defineProps<{ status: EscrowStatus | null | undefined }>();

const variantMap: Record<EscrowStatus, 'warning' | 'success' | 'danger'> = {
  held: 'warning',
  released: 'success',
  refunded: 'danger'
};

const labelMap: Record<EscrowStatus, string> = {
  held: 'Funds Held',
  released: 'Paid Out',
  refunded: 'Refunded'
};

const variant = computed(() => (props.status ? variantMap[props.status] : 'warning'));
const label = computed(() => (props.status ? labelMap[props.status] : 'Awaiting Payment'));
</script>

<style scoped>
.payment-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.payment-status-badge--warning {
  background: rgba(245, 158, 11, 0.18);
  color: var(--color-warning);
}

.payment-status-badge--success {
  background: rgba(15, 157, 88, 0.12);
  color: var(--color-success);
}

.payment-status-badge--danger {
  background: rgba(217, 48, 37, 0.15);
  color: var(--color-danger);
}
</style>
