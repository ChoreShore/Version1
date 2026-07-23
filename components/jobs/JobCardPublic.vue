<template>
  <article class="job-card">
    <div v-if="topPill" class="job-card__header">
      <StatusPill
        :label="topPill.label"
        :variant="topPill.variant"
      />
    </div>

    <NuxtLink :to="`/jobs/${job.id}`" class="job-card__title-link">
      <h3 class="job-card__title">{{ job.title }}</h3>
    </NuxtLink>
    <p class="job-card__price">
      {{ job.budget_type === 'hourly' ? `£${job.budget_amount ?? 0}/hr` : `£${job.budget_amount?.toLocaleString() ?? '0'}` }}
    </p>

    <div class="job-card__meta">
      <span class="job-card__time">{{ job.posted_at_relative }}</span>
      <span v-if="job.postcode_area" class="job-card__location">📍 {{ job.postcode_area }}</span>
    </div>

    <div class="job-card__tags">
      <InfoBadge
        v-for="tag in (job.tags || []).slice(0, 2)"
        :key="tag"
        :label="tag"
        variant="neutral"
      />
    </div>

    <NuxtLink :to="`/jobs/${job.id}`" class="btn btn--primary btn--full btn--card">
      View job details <ArrowRight :size="16" />
    </NuxtLink>
    <NuxtLink to="/auth/sign-up" class="btn btn--secondary btn--full btn--small">
      Sign up to apply
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicJobPreviewInput } from '~/schemas/job';
import StatusPill from '~/components/primitives/StatusPill.vue';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import { ArrowRight } from '@lucide/vue';

const props = defineProps<{
  job: PublicJobPreviewInput & { is_urgent?: boolean };
}>();

const topPill = computed(() => {
  if (props.job.is_urgent) return { label: 'Urgent', variant: 'warning' as const };
  const postedMs = Date.now() - new Date(props.job.created_at).getTime();
  if (postedMs < 24 * 60 * 60 * 1000) return { label: 'New', variant: 'info' as const };
  return null;
});
</script>

<style scoped>
.job-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: box-shadow 150ms ease, transform 150ms ease;
}

.job-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.job-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.job-card__title-link {
  text-decoration: none;
  color: inherit;
}

.job-card__title-link:hover .job-card__title {
  color: var(--color-primary-600);
}

.job-card__title {
  font-size: var(--text-base);
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
  transition: color 120ms ease;
}

.job-card__price {
  font-size: var(--text-lg);
  font-weight: 800;
  margin: 0;
  color: var(--color-text);
}

.job-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.job-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: background 120ms ease, transform 80ms ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--primary {
  background: var(--color-primary-600);
  color: var(--color-white);
}

.btn--primary:hover {
  background: var(--color-primary-700);
}

.btn--full {
  width: 100%;
}

.btn--card {
  margin-top: auto;
  border-radius: var(--radius-lg);
  padding: 14px;
}

.btn--small {
  padding: 8px 14px;
  font-size: var(--text-xs);
  border-radius: var(--radius-md);
}

.btn--secondary {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover {
  background: var(--color-hover);
}
</style>
