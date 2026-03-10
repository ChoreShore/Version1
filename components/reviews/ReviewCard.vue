<template>
  <article class="review-card">
    <header class="review-card__header">
      <div>
        <p class="review-card__eyebrow">{{ jobTitle }}</p>
        <h3 class="review-card__title">{{ reviewerName }}</h3>
      </div>
      <div class="review-card__rating" aria-label="Rating">
        <span v-for="star in 5" :key="star" class="review-card__star" :class="{ 'is-filled': star <= review.rating }">★</span>
      </div>
    </header>

    <p class="review-card__comment" v-if="review.comment">{{ review.comment }}</p>

    <footer class="review-card__footer">
      <span>{{ reviewerName }}</span>
      <time>{{ createdAt }}</time>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { ReviewInput } from '~/schemas/review';

const props = defineProps<{ review: ReviewInput }>();

const jobTitle = computed(() => props.review.job_title ?? 'Job');
const reviewerName = computed(() => props.review.reviewer_first_name ?? 'Employer');
const createdAt = computed(() => new Date(props.review.created_at).toLocaleDateString());
</script>

<style scoped>
.review-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.review-card__header {
  display: flex;
  justify-content: space-between;
}
.review-card__rating {
  display: inline-flex;
  gap: 2px;
}
.review-card__star {
  color: var(--color-border);
}
.review-card__star.is-filled {
  color: var(--color-warning);
}
.review-card__comment {
  margin: 0;
  color: var(--color-text-muted);
}
.review-card__footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}
</style>
