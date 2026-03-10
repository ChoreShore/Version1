<template>
  <article class="job-card">
    <header class="job-card__header">
      <div>
        <p class="job-card__category">{{ job.category_name || 'General' }}</p>
        <h3 class="job-card__title">
          <NuxtLink :to="`/jobs/${job.id}`">{{ job.title }}</NuxtLink>
        </h3>
      </div>
      <StatusPill :label="statusLabel" :variant="statusVariant" />
    </header>

    <p class="job-card__description">{{ job.description.slice(0, 180) }}…</p>

    <dl class="job-card__meta">
      <div>
        <dt>Budget</dt>
        <dd>{{ budgetDisplay }}</dd>
      </div>
      <div>
        <dt>Deadline</dt>
        <dd>{{ deadlineDisplay }}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>{{ job.postcode }}</dd>
      </div>
    </dl>

    <footer class="job-card__footer">
      <InfoBadge :label="`${job.application_count ?? 0} applications`" />
      <div class="job-card__actions">
        <slot name="actions" />
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { JobWithDetailsInput } from '~/schemas/job';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';

const props = defineProps<{ job: JobWithDetailsInput & { application_count?: number } }>();

const statusVariantMap: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
  open: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral'
};

const statusVariant = computed(() => statusVariantMap[props.job.status] ?? 'neutral');
const statusLabel = computed(() => props.job.status.replace('_', ' '));

const budgetDisplay = computed(() =>
  props.job.budget_type === 'hourly'
    ? `$${props.job.budget_amount}/hr`
    : `$${props.job.budget_amount.toLocaleString()}`
);

const deadlineDisplay = computed(() => new Date(props.job.deadline).toLocaleDateString());
</script>

<style scoped>
.job-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.job-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: flex-start;
}

.job-card__category {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-subtle);
}

.job-card__title {
  margin: 0;
  font-size: var(--text-lg);
}

.job-card__title a {
  color: inherit;
  text-decoration: none;
}

.job-card__description {
  margin: 0;
  color: var(--color-text-muted);
}

.job-card__meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
  margin: 0;
}

.job-card__meta dt {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-subtle);
}

.job-card__meta dd {
  margin: 0;
  font-weight: 600;
}

.job-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.job-card__actions {
  display: inline-flex;
  gap: var(--space-2);
}
</style>
