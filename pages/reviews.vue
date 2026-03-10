<template>
  <section class="reviews-page">
    <header class="reviews-page__header">
      <div>
        <p class="reviews-page__eyebrow">Reputation</p>
        <h1>Reviews</h1>
        <p class="reviews-page__description">See the feedback you have received and shared.</p>
      </div>
      <div class="reviews-page__stats">
        <div class="reviews-page__stat">
          <p>Average rating</p>
          <strong>{{ averageRating }}</strong>
        </div>
        <div class="reviews-page__stat">
          <p>Reviews</p>
          <strong>{{ reviews.length }}</strong>
        </div>
        <div class="reviews-page__stat">
          <p>5★ share</p>
          <strong>{{ fiveStarShare }}</strong>
        </div>
      </div>
    </header>

    <nav class="reviews-page__filters" aria-label="Review view">
      <button
        v-for="option in typeOptions"
        :key="option.value"
        type="button"
        class="reviews-page__filter"
        :class="{ 'is-active': reviewType === option.value }"
        @click="reviewType = option.value"
      >
        {{ option.label }}
      </button>
    </nav>

    <DataList :title="panelTitle" :description="panelDescription">
      <template v-if="loading">
        <li v-for="n in 3" :key="`review-skeleton-${n}`">
          <LoadingSkeleton variant="block" height="140px" />
        </li>
      </template>

      <template v-else-if="error">
        <li>
          <EmptyState title="Unable to load reviews" :description="error" />
        </li>
      </template>

      <template v-else-if="!reviews.length">
        <li>
          <EmptyState
            :title="reviewType === 'received' ? (role === 'employer' ? 'No reviews received' : 'No reviews received') : 'No reviews given'"
            :description="reviewType === 'received' ? (role === 'employer' ? 'Complete jobs to receive feedback from workers.' : 'Complete jobs to collect feedback from employers.') : 'Leave reviews for completed jobs to help the community.'"
          />
        </li>
      </template>

      <template v-else>
        <li v-for="review in reviews" :key="review.review_id">
          <ReviewCard :review="review" />
        </li>
      </template>
    </DataList>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
});
import { computed, ref, watch } from 'vue';
import DataList from '~/components/primitives/DataList.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import ReviewCard from '~/components/reviews/ReviewCard.vue';
import { useReviews } from '~/composables/useReviews';
import { useActiveRole } from '~/composables/useActiveRole';
import type { ReviewInput } from '~/schemas/review';

const reviewsApi = useReviews();
const { role } = useActiveRole();

const reviewType = ref<'received' | 'given'>('received');
const reviews = ref<ReviewInput[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const typeOptions = [
  { label: 'Received', value: 'received' as const },
  { label: 'Given', value: 'given' as const }
];

const fetchReviews = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await reviewsApi.listReviews(reviewType.value, role.value);
    reviews.value = response.reviews ?? [];
  } catch (err: any) {
    error.value = err?.data?.statusMessage || 'Something went wrong.';
  } finally {
    loading.value = false;
  }
};

watch([reviewType, role], () => {
  fetchReviews();
}, { immediate: true });

const averageRating = computed(() => {
  if (!reviews.value.length) return '—';
  const sum = reviews.value.reduce((total, review) => total + (review.rating ?? 0), 0);
  return (sum / reviews.value.length).toFixed(1);
});

const fiveStarShare = computed(() => {
  if (!reviews.value.length) return '0%';
  const fiveStarCount = reviews.value.filter((review) => review.rating === 5).length;
  return `${Math.round((fiveStarCount / reviews.value.length) * 100)}%`;
});

const panelTitle = computed(() => reviewType.value === 'received' ? 'Feedback received' : 'Reviews you19ve given');
const panelDescription = computed(() => reviewType.value === 'received'
  ? 'What employers have said about your work.'
  : 'Your own reviews for teammates and partners.'
);
</script>

<style scoped>
.reviews-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.reviews-page__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-5);
}

.reviews-page__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.reviews-page__description {
  margin: 4px 0 0;
  color: var(--color-text-muted);
}

.reviews-page__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}

.reviews-page__stat {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  background: var(--color-surface);
}

.reviews-page__stat p {
  margin: 0;
  color: var(--color-text-subtle);
}

.reviews-page__stat strong {
  font-size: var(--text-xl);
}

.reviews-page__filters {
  display: inline-flex;
  gap: var(--space-2);
}

.reviews-page__filter {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  padding: 8px 16px;
  cursor: pointer;
}

.reviews-page__filter.is-active {
  background: var(--color-primary-600);
  border-color: transparent;
  color: white;
}
</style>
