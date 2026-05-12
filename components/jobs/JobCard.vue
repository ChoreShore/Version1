<template>
  <article class="job-card">
    <header class="job-card__header">
      <div>
        <p class="job-card__category">{{ job.category_name || 'General' }}</p>
        <h3 class="job-card__title">
          <NuxtLink :to="`/jobs/${job.id}`">{{ job.title }}</NuxtLink>
        </h3>
      </div>
      <div class="job-card__status-group">
        <StatusPill v-if="job.has_applied" label="Applied" variant="success" />
        <StatusPill v-if="job.distance_km !== undefined" :label="`${job.distance_km.toFixed(1)} km`" variant="info" />
        <StatusPill :label="statusLabel" :variant="statusVariant" />
      </div>
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
      <InfoBadge :label="`${applicationCount} applications`" />
      <div class="job-card__actions">
        <slot name="actions" />
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { JobWithDetailsInput } from '~/schemas/job';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';

const props = defineProps<{ job: JobWithDetailsInput & { application_count?: number; has_applied?: boolean; distance_km?: number } }>();

const statusVariantMap: Record<string, 'neutral' | 'info' | 'success' | 'warning'> = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  completed: 'success'
};

const statusVariant = computed(() => statusVariantMap[props.job.status] ?? 'neutral');
const statusLabel = computed(() => props.job.status.replace('_', ' '));

const applicationCount = computed(() => props.job.application_count ?? 0);

const budgetDisplay = computed(() =>
  props.job.budget_type === 'hourly'
    ? `$${props.job.budget_amount}/hr`
    : `$${props.job.budget_amount.toLocaleString()}`
);

const deadlineDisplay = computed(() => new Date(props.job.deadline).toLocaleDateString());
</script>

<style scoped>
.job-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow);
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.job-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  opacity: 0.8;
}

.job-card:hover,
.job-card:focus-within {
  transform: translateY(-4px);
  background: #fbfcfc;
  box-shadow: var(--shadow-hover);
}

.job-card__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  align-items: flex-start;
}

.job-card__status-group {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-wrap: wrap;
}

.job-card__category {
  margin: 0;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.job-card__title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 650;
  color: var(--text);
  line-height: 1.3;
}

.job-card__title a {
  color: inherit;
  text-decoration: none;
}

.job-card__description {
  margin: 0;
  color: var(--muted);
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
  color: var(--muted);
}

.job-card__meta dd {
  margin: 0;
  font-weight: 600;
  color: var(--text);
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
