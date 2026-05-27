<template>
  <article class="job-card" :aria-label="`Job: ${job.title} in ${job.category_name || 'General'}`">
    <header class="job-card__header">
      <div>
        <p class="job-card__category">{{ job.category_name || 'General' }}</p>
        <h3 class="job-card__title">
          <NuxtLink :to="`/jobs/${job.id}`" :aria-label="`View details for ${job.title}`">{{ job.title }}</NuxtLink>
        </h3>
      </div>
      <div class="job-card__status-group" role="group" aria-label="Job status">
        <StatusPill v-if="job.is_urgent" :label="'Urgent'" variant="warning" aria-label="Urgent job">
          <Flame :size="12" class="status-icon" />
        </StatusPill>
        <StatusPill v-if="job.is_recurring" label="Recurring" variant="info" aria-label="Recurring job" />
        <StatusPill v-if="job.has_applied" label="Applied" variant="success" aria-label="You have applied to this job" />
        <StatusPill v-if="job.distance_km !== undefined" :label="`${job.distance_km?.toFixed(1)} km`" variant="info" :aria-label="`${job.distance_km?.toFixed(1)} kilometers away`" />
        <StatusPill :label="statusLabel" :variant="statusVariant" :aria-label="`Job status: ${statusLabel}`" />
      </div>
    </header>

    <p 
      class="job-card__description" 
      :class="{ 'is-expanded': isExpanded }"
      :id="`job-desc-${job.id}`"
      aria-live="polite"
    >{{ isExpanded ? job.description : truncatedDescription }}</p>
    <button 
      v-if="job.description.length > 180" 
      type="button" 
      class="job-card__expand" 
      @click.stop="toggleExpand"
      :aria-expanded="isExpanded"
      :aria-controls="`job-desc-${job.id}`"
      :id="`job-expand-${job.id}`"
    >
      <span class="expand-text">{{ isExpanded ? 'Show less' : 'Show more' }}</span>
      <ChevronDown :size="16" class="expand-icon" :class="{ 'is-expanded': isExpanded }" />
    </button>

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
import { computed, ref } from 'vue';
import { formatDate } from '~/server/utils/dateFormat';
import type { JobWithDetailsInput } from '~/schemas/job';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import { Flame, ChevronDown } from '@lucide/vue';

interface JobCardProps {
  job: JobWithDetailsInput & { application_count?: number; has_applied?: boolean; distance_km?: number };
  clickable?: boolean;
}

const props = withDefaults(defineProps<JobCardProps>(), {
  clickable: true
});

const isExpanded = ref(false);

const truncatedDescription = computed(() => {
  const desc = props.job.description;
  if (desc.length <= 180) return desc;
  
  // Word-aware truncation - find the last space before 180 chars
  const truncated = desc.slice(0, 180);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 150) {
    return truncated.slice(0, lastSpace) + '…';
  }
  
  return truncated + '…';
});

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
    ? `£${props.job.budget_amount ?? 0}/hr`
    : `£${(props.job.budget_amount ?? 0).toLocaleString()}`
);

const deadlineDisplay = computed(() => formatDate(props.job.deadline));

function handleCardClick() {
  if (props.clickable) {
    // handle card click logic here
  }
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}
</script>

<style scoped>
.job-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.job-card.is-clickable {
  cursor: pointer;
}

.job-card.is-clickable:hover {
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

.job-card__title a:focus-visible {
  outline: 2px solid var(--dark);
  outline-offset: 2px;
  border-radius: 2px;
}

.job-card__description {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
  max-height: 4.8em;
  overflow: hidden;
  position: relative;
  transition: max-height 0.3s ease;
}

.job-card__description.is-expanded {
  max-height: none;
}

.job-card__description.is-expanded::after {
  display: none;
}

.job-card__description:not(.is-expanded)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2em;
  background: linear-gradient(transparent, var(--surface));
  pointer-events: none;
}

.job-card__expand {
  background: none;
  border: none;
  color: var(--primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  margin-top: var(--space-1);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  transition: color 0.2s ease;
}

.job-card__expand:hover {
  color: var(--accent);
}

.job-card__expand:focus-visible {
  outline: 2px solid var(--dark);
  outline-offset: 2px;
  border-radius: 2px;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.expand-icon.is-expanded {
  transform: rotate(180deg);
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

.status-icon {
  display: inline-flex;
  align-items: center;
}
</style>
