<template>
  <article class="job-card">
    <div class="job-card__header">
      <StatusPill
        v-if="topPill"
        :label="topPill.label"
        :variant="topPill.variant"
      />
      <button
        class="job-card__save"
        :class="{ saved: isSaved }"
        @click="$emit('toggle-save', job.id)"
        aria-label="Save job"
      >
        <Heart :size="20" :class="{ filled: isSaved }" />
      </button>
    </div>

    <h3 class="job-card__title">{{ job.title }}</h3>
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

    <NuxtLink to="/auth/sign-up" class="btn btn--full btn--card">
      Sign up to apply
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicJobPreviewInput } from '~/schemas/job';
import StatusPill from '~/components/primitives/StatusPill.vue';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import { Heart } from '@lucide/vue';

interface Props {
  job: PublicJobPreviewInput & { is_urgent?: boolean };
  isSaved?: boolean;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'toggle-save', jobId: string): void;
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
  background: var(--surface);
  border: 1px solid var(--border);
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

.job-card__save {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 120ms ease;
  padding: 4px;
}

.job-card__save:hover,
.job-card__save.saved {
  opacity: 1;
}

.job-card__save .filled {
  fill: currentColor;
  color: #ef4444;
}

.job-card__title {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.job-card__price {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 800;
  margin: 0;
  color: var(--text);
}

.job-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--muted);
}

.job-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
