<template>
  <article class="worker-card" :aria-label="`Worker profile: ${worker.display_name}, ${worker.average_rating ? `${worker.average_rating.toFixed(1)} star rating` : 'New worker'}, ${worker.completed_jobs} jobs completed`">
    <div class="worker-card__header">
      <div class="worker-card__avatar">
        <img v-if="worker.photo_url" :src="worker.photo_url" :alt="`${worker.display_name}'s profile photo`" class="worker-card__photo" />
        <div v-else class="worker-card__photo-placeholder" :aria-label="`${worker.display_name}'s initials`">{{ worker.display_name.charAt(0) }}</div>
        <div v-if="worker.is_verified" class="worker-card__verified" title="Verified worker" aria-label="Verified worker">
          <Check :size="12" />
        </div>
      </div>
      <button class="worker-card__save" @click="$emit('save', worker.id)" aria-label="Save worker to favorites">
        <Heart :size="20" />
      </button>
    </div>

    <h3 class="worker-card__name">{{ worker.display_name }}</h3>
    
    <div class="worker-card__rating" v-if="worker.average_rating" role="img" :aria-label="`${worker.average_rating.toFixed(1)} out of 5 stars, ${worker.total_reviews} reviews`">
      <span class="worker-card__stars"><Star :size="14" class="star-icon" /> {{ worker.average_rating.toFixed(1) }}</span>
      <span class="worker-card__reviews">({{ worker.total_reviews }} reviews)</span>
    </div>
    <div class="worker-card__rating" v-else>
      <span class="worker-card__no-rating">New worker</span>
    </div>

    <div class="worker-card__stats">
      <span class="worker-card__stat"><Check :size="14" class="check-icon" /> {{ worker.completed_jobs }} jobs completed</span>
      <span class="worker-card__stat" v-if="worker.postcode_area"><MapPin :size="14" class="location-icon" /> {{ worker.postcode_area }}</span>
    </div>

    <p v-if="worker.bio" class="worker-card__bio">{{ worker.bio }}</p>
    <p v-else class="worker-card__bio worker-card__bio--empty">No bio available</p>

    <div class="worker-card__tags" role="group" aria-label="Worker badges">
      <InfoBadge v-if="worker.is_verified" label="Verified" variant="info" aria-label="Verified worker" />
      <InfoBadge v-if="worker.completed_jobs >= 10" label="Experienced" variant="neutral" aria-label="Experienced worker with 10+ completed jobs" />
      <InfoBadge v-if="worker.average_rating && worker.average_rating >= 4.8" label="Top Rated" variant="success" aria-label="Top rated worker with 4.8+ star rating" />
    </div>

    <NuxtLink :to="`/profile/${worker.username}`" class="worker-card__cta">
      View Profile
    </NuxtLink>
  </article>
</template>

<script setup lang="ts">
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import { Heart, Star, Check, MapPin } from '@lucide/vue';

defineProps<{
  worker: {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    photo_url: string | null;
    postcode_area: string | null;
    average_rating: number | null;
    total_reviews: number;
    completed_jobs: number;
    member_since: string;
    is_verified: boolean;
  };
}>();

defineEmits<{
  save: [id: string];
}>();
</script>

<style scoped>
.worker-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: box-shadow 150ms ease, transform 150ms ease;
}

.worker-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}

.worker-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.worker-card__avatar {
  position: relative;
  width: 60px;
  height: 60px;
}

.worker-card__photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.worker-card__photo-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  border: 2px solid var(--color-border);
}

.worker-card__verified {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: var(--color-success-600);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-surface);
}

.worker-card__save {
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 120ms ease;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.worker-card__save:hover {
  opacity: 1;
}

.worker-card__save:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: 2px;
}

.worker-card__name {
  font-size: var(--text-lg);
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.worker-card__rating {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.worker-card__stars {
  font-weight: 600;
  color: var(--color-text);
}

.worker-card__reviews {
  color: var(--color-text-subtle);
}

.worker-card__no-rating {
  color: var(--color-text-subtle);
  font-style: italic;
}

.worker-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-subtle);
}

.worker-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-icon,
.check-icon,
.location-icon {
  display: inline-flex;
  align-items: center;
}

.worker-card__bio {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.worker-card__bio--empty {
  color: var(--color-text-subtle);
  font-style: italic;
}

.worker-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.worker-card__cta {
  margin-top: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 12px;
  text-align: center;
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
  font-size: var(--text-sm);
  transition: background 120ms ease;
}

.worker-card__cta:hover {
  background: var(--color-surface-muted);
}

.worker-card__cta:focus-visible {
  outline: 2px solid var(--color-teal);
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
