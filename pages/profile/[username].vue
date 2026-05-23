<template>
  <div class="profile-page">
    <!-- Loading -->
    <div v-if="loading" class="profile-page__loading">
      <LoadingSkeleton variant="block" height="200px" />
      <div class="profile-page__grid">
        <div>
          <LoadingSkeleton variant="block" height="120px" class="mt-4" />
          <LoadingSkeleton variant="block" height="200px" class="mt-4" />
        </div>
        <div>
          <LoadingSkeleton variant="block" height="180px" class="mt-4" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="profile-page__error">
      <EmptyState
        title="Profile unavailable"
        :description="errorMessage + ' This profile may not exist or there was a problem loading it. Check the username is spelled correctly, the user may have changed their username, or try again later.'"
        icon="⚠️"
      >
        <template #actions>
          <NuxtLink to="/" class="empty-state__cta">Go home</NuxtLink>
        </template>
      </EmptyState>
    </div>

    <!-- Profile Content -->
    <template v-else-if="data">
      <!-- Header -->
      <header class="profile-header">
        <div class="profile-header__left">
          <div class="profile-header__avatar">
            <img v-if="data.profile.photo_url" :src="data.profile.photo_url" :alt="displayName" />
            <div v-else class="profile-header__avatar-placeholder">
              {{ initials }}
            </div>
          </div>
          <div class="profile-header__info">
            <h1 class="profile-header__name">{{ displayName }}</h1>
            <div class="profile-header__meta">
              <span v-if="data.profile.postcode_area" class="profile-header__location">
                <span class="location-pin">📍</span> {{ data.profile.postcode_area }}
              </span>
              <span class="profile-header__roles">
                <StatusPill
                  v-for="role in displayRoles"
                  :key="role"
                  :label="role"
                  variant="neutral"
                  size="sm"
                />
              </span>
              <span v-if="data.overall_stats.average_rating != null" class="profile-header__rating">
                ⭐ {{ data.overall_stats.average_rating.toFixed(1) }}
                <span class="rating-count">({{ data.overall_stats.total_reviews }})</span>
              </span>
            </div>
          </div>
        </div>
        <div class="profile-header__actions">
          <button v-if="isOwnProfile" class="profile-btn profile-btn--primary" @click="goToSettings">
            Edit Profile
          </button>
          <template v-else>
            <button class="profile-btn profile-btn--primary" @click="handleMessage">
              {{ user ? 'Message' : 'Sign up to message' }}
            </button>
            <button class="profile-btn profile-btn--secondary" title="Save (coming soon)">
              <span>❤️</span> Save
            </button>
          </template>
        </div>
      </header>

      <!-- Main Grid -->
      <div class="profile-page__grid">
        <!-- Left Column -->
        <main class="profile-main">
          <!-- About -->
          <section v-if="data.profile.bio" class="profile-section">
            <h2 class="profile-section__title">👤 About</h2>
            <p class="profile-bio">{{ data.profile.bio }}</p>
          </section>

          <!-- Work History (as Worker) -->
          <section v-if="data.worker_stats" class="profile-section">
            <h2 class="profile-section__title">💼 Work History (as Worker)</h2>
            <div v-if="data.worker_stats.completed_contracts.length > 0" class="profile-cards">
              <article
                v-for="contract in data.worker_stats.completed_contracts"
                :key="contract.id"
                class="profile-card"
              >
                <h3 class="profile-card__title">{{ contract.job?.title ?? 'Untitled job' }}</h3>
                <div class="profile-card__meta">
                  <span v-if="contract.job?.postcode">📍 {{ contract.job.postcode }}</span>
                  <span v-if="contract.job?.budget_amount">
                    {{ contract.job.budget_type === 'hourly' ? '£' + contract.job.budget_amount + '/hr' : '£' + contract.job.budget_amount }}
                  </span>
                </div>
                <div class="profile-card__status">
                  <StatusPill label="Completed" variant="success" size="sm" />
                </div>
              </article>
            </div>
            <p v-else class="profile-empty">No completed jobs yet.</p>
          </section>

          <!-- Jobs Posted (as Employer) -->
          <section v-if="data.employer_stats" class="profile-section">
            <h2 class="profile-section__title">📋 Jobs Posted (as Employer)</h2>
            <div v-if="data.employer_stats.jobs_posted.length > 0" class="profile-cards">
              <article
                v-for="job in data.employer_stats.jobs_posted"
                :key="job.id"
                class="profile-card"
              >
                <h3 class="profile-card__title">{{ job.title }}</h3>
                <div class="profile-card__meta">
                  <span v-if="job.postcode">📍 {{ job.postcode }}</span>
                  <span v-if="job.budget_amount">
                    {{ job.budget_type === 'hourly' ? '£' + job.budget_amount + '/hr' : '£' + job.budget_amount }}
                  </span>
                </div>
                <div class="profile-card__status">
                  <StatusPill :label="job.status" :variant="jobStatusVariant(job.status)" size="sm" />
                </div>
              </article>
            </div>
            <p v-else class="profile-empty">No jobs posted yet.</p>
          </section>

          <!-- Reviews -->
          <section v-if="data.overall_stats.total_reviews > 0" class="profile-section">
            <h2 class="profile-section__title">⭐ Reviews</h2>
            <div class="profile-reviews">
              <article
                v-for="review in allReviews"
                :key="review.id"
                class="profile-review"
              >
                <div class="profile-review__header">
                  <div class="profile-review__stars">
                    <span v-for="n in 5" :key="n" class="profile-review__star" :class="{ 'is-filled': n <= review.rating }">⭐</span>
                  </div>
                  <span class="profile-review__context">{{ review.context }}</span>
                </div>
                <p v-if="review.comment" class="profile-review__comment">"{{ review.comment }}"</p>
                <p class="profile-review__author">
                  — {{ review.reviewer_first_name || review.reviewer_username || 'Anonymous' }}
                  <span v-if="review.job_title">on {{ review.job_title }}</span>
                </p>
                <time class="profile-review__date">{{ formatDate(review.created_at) }}</time>
              </article>
            </div>
          </section>
        </main>

        <!-- Right Sidebar -->
        <aside class="profile-sidebar">
          <!-- Trust & Safety -->
          <div class="profile-sidebar__box">
            <h3 class="profile-sidebar__title">🛡️ Trust & Safety</h3>
            <ul class="profile-sidebar__list">
              <li class="profile-sidebar__item">
                <span class="profile-sidebar__check">✓</span>
                <span>Email verified</span>
              </li>
              <li v-if="data.profile.rtw_status === 'verified'" class="profile-sidebar__item">
                <span class="profile-sidebar__check">✓</span>
                <span>ID verified</span>
              </li>
              <li v-else class="profile-sidebar__item profile-sidebar__item--muted">
                <span class="profile-sidebar__check profile-sidebar__check--muted">○</span>
                <span>ID not verified</span>
              </li>
            </ul>
          </div>

          <!-- Stats -->
          <div class="profile-sidebar__box">
            <h3 class="profile-sidebar__title">📊 Stats</h3>
            <ul class="profile-sidebar__list">
              <li v-if="data.worker_stats" class="profile-sidebar__stat">
                <strong>{{ data.worker_stats.total_jobs_completed }}</strong>
                <span>jobs completed</span>
              </li>
              <li v-if="data.employer_stats" class="profile-sidebar__stat">
                <strong>{{ data.employer_stats.total_jobs_posted }}</strong>
                <span>jobs posted</span>
              </li>
              <li v-if="data.overall_stats.average_rating != null" class="profile-sidebar__stat">
                <strong>⭐ {{ data.overall_stats.average_rating.toFixed(1) }}</strong>
                <span>average rating</span>
              </li>
            </ul>
          </div>

          <!-- CTA -->
          <div v-if="!isOwnProfile" class="profile-sidebar__box profile-sidebar__box--cta">
            <h3 class="profile-sidebar__title">💼 Work with {{ data.profile.first_name || data.profile.username }}</h3>
            <button class="profile-btn profile-btn--primary profile-btn--block" @click="handleMessage">
              {{ user ? 'Message' : 'Sign up to hire or apply' }}
            </button>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';

interface ProfileData {
  profile: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    photo_url: string | null;
    roles: string[];
    postcode_area: string | null;
    rtw_status: string | null;
    created_at: string;
  };
  worker_stats: {
    completed_contracts: Array<{
      id: string;
      status: string;
      created_at: string;
      job: {
        id: string;
        title: string;
        postcode: string | null;
        budget_amount: number;
        budget_type: string;
      } | null;
    }>;
    total_jobs_completed: number;
    reviews: Array<{
      id: string;
      job_id: string;
      rating: number;
      comment: string | null;
      created_at: string;
      job_title: string | null;
      reviewer_username: string | null;
      reviewer_first_name: string | null;
      reviewer_last_name: string | null;
    }>;
    average_rating: number | null;
  } | null;
  employer_stats: {
    jobs_posted: Array<{
      id: string;
      title: string;
      postcode: string | null;
      budget_amount: number;
      budget_type: string;
      status: string;
      created_at: string;
    }>;
    total_jobs_posted: number;
    reviews: Array<{
      id: string;
      job_id: string;
      rating: number;
      comment: string | null;
      created_at: string;
      job_title: string | null;
      reviewer_username: string | null;
      reviewer_first_name: string | null;
      reviewer_last_name: string | null;
    }>;
    average_rating: number | null;
  } | null;
  overall_stats: {
    total_reviews: number;
    average_rating: number | null;
  };
}

definePageMeta({
  title: 'Profile'
});

const route = useRoute();
const router = useRouter();
const user = useSupabaseUser();

const username = computed(() => route.params.username as string);

const { data, pending: loading, error } = useFetch<ProfileData>(() => `/api/profile/${username.value}`, {
  key: `profile-${username.value}`,
  server: true
});

const isOwnProfile = computed(() => {
  if (!user.value || !data.value) return false;
  return user.value.id === data.value.profile.id;
});

const displayName = computed(() => {
  const p = data.value?.profile;
  if (!p) return '';
  if (p.first_name && p.last_name) return `${p.first_name} ${p.last_name}`;
  return p.username;
});

const initials = computed(() => {
  const p = data.value?.profile;
  if (!p) return '';
  if (p.first_name && p.last_name) return `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
  return p.username.slice(0, 2).toUpperCase();
});

const displayRoles = computed(() => {
  const roles = data.value?.profile.roles || [];
  return roles.map(r => r === 'employer' ? 'Employer' : 'Worker');
});

const errorMessage = computed(() => {
  if (!error.value) return '';
  return (error.value as any)?.statusMessage || 'Something went wrong';
});

const allReviews = computed(() => {
  const result: Array<{ context: string; id: string; job_id: string; rating: number; comment: string | null; created_at: string; job_title: string | null; reviewer_username: string | null; reviewer_first_name: string | null; reviewer_last_name: string | null }> = [];
  const worker = data.value?.worker_stats?.reviews || [];
  const employer = data.value?.employer_stats?.reviews || [];

  for (const r of worker) {
    result.push({ ...r, context: 'As Worker' });
  }
  for (const r of employer) {
    result.push({ ...r, context: 'As Employer' });
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
});

function jobStatusVariant(status: string) {
  switch (status) {
    case 'open': return 'success' as const;
    case 'completed': return 'neutral' as const;
    case 'closed': return 'warning' as const;
    default: return 'neutral' as const;
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function goToSettings() {
  router.push('/settings');
}

function handleMessage() {
  if (!user.value) {
    router.push('/auth/sign-up');
    return;
  }
  if (isOwnProfile.value) {
    router.push('/settings');
    return;
  }
  router.push(`/messages?to=${username.value}`);
}
</script>

<style scoped>
.profile-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-6);
}

.profile-page__grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-8);
  margin-top: var(--space-6);
}

@media (max-width: 768px) {
  .profile-page__grid {
    grid-template-columns: 1fr;
  }
}

/* Header */
.profile-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.profile-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.profile-header__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-surface-muted);
}

.profile-header__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-header__avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}

.profile-header__name {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
}

.profile-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.profile-header__location {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.location-pin {
  margin-right: 2px;
}

.profile-header__roles {
  display: flex;
  gap: var(--space-1);
}

.profile-header__rating {
  font-weight: 600;
  font-size: var(--text-sm);
}

.rating-count {
  color: var(--color-text-muted);
  font-weight: 400;
}

.profile-header__actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .profile-header__actions {
    width: 100%;
    margin-top: var(--space-3);
  }
}

/* Buttons */
.profile-btn {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: var(--text-sm);
  transition: opacity 0.15s;
}

.profile-btn:hover {
  opacity: 0.9;
}

.profile-btn--primary {
  background: var(--color-primary-600);
  color: white;
}

.profile-btn--secondary {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.profile-btn--block {
  width: 100%;
}

/* Main Sections */
.profile-section {
  margin-bottom: var(--space-8);
}

.profile-section__title {
  margin: 0 0 var(--space-4) 0;
  font-size: var(--text-lg);
  font-weight: 700;
}

.profile-bio {
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}

/* Cards */
.profile-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-3);
}

.profile-card {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.profile-card__title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-base);
  font-weight: 600;
}

.profile-card__meta {
  display: flex;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.profile-card__status {
  margin-top: var(--space-2);
}

/* Reviews */
.profile-reviews {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-review {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.profile-review__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.profile-review__stars {
  display: flex;
  gap: 2px;
}

.profile-review__star {
  opacity: 0.25;
  font-size: var(--text-sm);
}

.profile-review__star.is-filled {
  opacity: 1;
}

.profile-review__context {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.profile-review__comment {
  margin: 0 0 var(--space-2) 0;
  font-style: italic;
  color: var(--color-text);
}

.profile-review__author {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.profile-review__date {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

/* Empty states */
.profile-empty {
  color: var(--color-text-muted);
  font-style: italic;
}

/* Sidebar */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-sidebar__box {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.profile-sidebar__box--cta {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
}

.profile-sidebar__title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--text-base);
  font-weight: 700;
}

.profile-sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.profile-sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.profile-sidebar__item--muted {
  color: var(--color-text-muted);
}

.profile-sidebar__check {
  color: var(--color-success);
  font-weight: 700;
}

.profile-sidebar__check--muted {
  color: var(--color-text-muted);
}

.profile-sidebar__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-sidebar__stat strong {
  font-size: var(--text-lg);
}

.profile-sidebar__stat span {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .profile-page {
    padding: var(--space-4);
  }
}
</style>
