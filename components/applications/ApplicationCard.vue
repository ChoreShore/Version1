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
    </dl>

    <footer class="application-card__footer">
      <InfoBadge v-if="application.availability_notes" :label="application.availability_notes" />
      <div class="application-card__actions">
        <slot name="actions" />
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { ApplicationWithDetails } from '~/types/application';
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
</style>
