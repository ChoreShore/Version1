<template>
  <article class="application-card">
    <header class="application-card__header">
      <div>
        <p class="application-card__subheading">{{ jobTitle }}</p>
        <h3 class="application-card__title">{{ primaryName }}</h3>
      </div>
      <StatusPill :label="statusLabel" :variant="statusVariant" />
    </header>

    <p v-if="application.cover_letter" class="application-card__excerpt">
      “{{ application.cover_letter.slice(0, 200) }}”
    </p>

    <dl class="application-card__meta">
      <div>
        <dt>Proposed rate</dt>
        <dd>{{ proposedRate }}</dd>
      </div>
      <div>
        <dt>Submitted</dt>
        <dd>{{ submittedAt }}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{{ statusLabel }}</dd>
      </div>
      <div v-if="perspective === 'employer' && application.status === 'withdrawn' && application.withdrawal_reason">
        <dt>Withdrawal reason</dt>
        <dd>{{ withdrawalReasonLabel }}</dd>
      </div>
    </dl>

    <footer class="application-card__footer">
      <InfoBadge v-if="application.availability_notes" :label="application.availability_notes" />
      <div class="application-card__actions">
        <NuxtLink 
          v-if="application.status === 'accepted'" 
          :to="`/messages?application=${application.id}`"
          class="application-card__message-btn"
        >
          Message {{ perspective === 'employer' ? 'worker' : 'employer' }}
        </NuxtLink>
        <button
          v-if="perspective === 'worker' && application.status !== 'withdrawn'"
          type="button"
          class="application-card__withdraw-btn"
          @click="emit('withdraw', application.id)"
        >
          Withdraw
        </button>
        <slot name="actions" />
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ApplicationWithDetails } from '~/schemas/application';
import StatusPill from '~/components/primitives/StatusPill.vue';
import InfoBadge from '~/components/primitives/InfoBadge.vue';

const props = withDefaults(
  defineProps<{
    application: ApplicationWithDetails & { job_title?: string; employer_name?: string; worker_name?: string };
    perspective?: 'employer' | 'worker';
  }>(),
  {
    perspective: 'employer'
  }
);

const emit = defineEmits<{
  withdraw: [applicationId: string];
}>();

const statusVariantMap: Record<string, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  pending: 'info',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral'
};

const statusVariant = computed(() => statusVariantMap[props.application.status] ?? 'neutral');
const statusLabel = computed(() => props.application.status.replace('_', ' '));

const jobTitle = computed(() => props.application.job_title ?? 'Untitled job');
const primaryName = computed(() =>
  props.perspective === 'employer'
    ? props.application.worker_name ?? 'Applicant'
    : props.application.employer_name ?? 'Employer'
);

const proposedRate = computed(() => {
  if (props.application.proposed_rate == null) return 'Not provided';
  return `$${props.application.proposed_rate.toLocaleString()}`;
});

const submittedAt = computed(() => new Date(props.application.created_at).toLocaleString());

const withdrawalReasonLabels: Record<string, string> = {
  found_another_job: 'Found another job',
  personal_reasons: 'Personal reasons'
};

const withdrawalReasonLabel = computed(() => {
  const reason = props.application.withdrawal_reason;
  return reason ? (withdrawalReasonLabels[reason] ?? reason) : '';
});
</script>

<style scoped>
.application-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.application-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.application-card__subheading {
  margin: 0;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.application-card__title {
  margin: 0;
  font-size: var(--text-lg);
}

.application-card__excerpt {
  margin: 0;
  color: var(--color-text-muted);
  font-style: italic;
}

.application-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.application-card__meta dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.application-card__meta dd {
  margin: 0;
  font-weight: 600;
}

.application-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.application-card__actions {
  display: inline-flex;
  gap: var(--space-2);
}

.application-card__message-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-primary-600);
  background: var(--color-primary-600);
  color: white;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background 150ms ease;
}

.application-card__message-btn:hover {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
}

.application-card__withdraw-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-danger);
  background: transparent;
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
}

.application-card__withdraw-btn:hover {
  background: var(--color-danger);
  color: white;
}
</style>
