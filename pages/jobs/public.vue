<template>
  <section class="public-jobs-page">
    <header class="public-jobs-page__header">
      <div>
        <p class="public-jobs-page__eyebrow">Browse opportunities</p>
        <h1>Find Jobs</h1>
        <p>Browse available jobs and start earning today.</p>
      </div>
      <div class="public-jobs-page__header-actions">
        <button
          type="button"
          class="public-jobs-page__location-btn"
          :disabled="geoLoading"
          @click="handleFindNearby"
        >
          {{ geoLoading ? 'Locating...' : 'Find jobs near me' }}
        </button>
      </div>
    </header>

    <div v-if="geoError" class="public-jobs-page__geo-error">
      <p>{{ geoError }}</p>
      <button type="button" class="public-jobs-page__retry-btn" @click="handleFindNearby">Retry</button>
    </div>

    <div v-if="isNearbyMode" class="public-jobs-page__nearby-banner">
      <p>Showing jobs within 10 km of your location</p>
      <button type="button" class="public-jobs-page__clear-btn" @click="loadJobs">Show all jobs</button>
    </div>

    <!-- Category Filter -->
    <div v-if="categories.length > 0" class="public-jobs-page__categories">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-pill"
        :class="{ active: selectedCategory === category.id }"
        @click="filterByCategory(category.id)"
      >
        <Check v-if="selectedCategory === category.id" :size="14" class="category-pill__check" />
        <span>{{ category.name }}</span>
      </button>
      <button
        v-if="selectedCategory"
        class="category-pill category-pill--clear"
        @click="clearCategoryFilter"
      >
        <X :size="14" />
        <span>Clear filter</span>
      </button>
    </div>

    <Carousel v-if="jobsLoading">
      <div v-for="n in 8" :key="`job-skeleton-${n}`" class="job-skeleton-card">
        <LoadingSkeleton variant="block" height="180px" />
      </div>
    </Carousel>

    <EmptyState
      v-else-if="!filteredJobs.length"
      title="No jobs found"
      description="Available jobs matching your criteria will appear here. Try adjusting filters or check back later."
      icon="📋"
    >
      <template #actions>
        <button type="button" class="empty-state__cta" @click="loadJobs">Refresh</button>
      </template>
    </EmptyState>

    <Carousel v-else>
      <JobCardPublic v-for="job in filteredJobs" :key="job.id" :job="job" />
    </Carousel>

    <!-- Content Sections -->
    <TrustSection />
    <HowItWorksSection />
    <LegalSection />
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});
import { onMounted, ref } from 'vue';
import { Check, X } from '@lucide/vue';
import JobCardPublic from '~/components/jobs/JobCardPublic.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import Carousel from '~/components/primitives/Carousel.vue';
import TrustSection from '~/components/sections/TrustSection.vue';
import HowItWorksSection from '~/components/sections/HowItWorksSection.vue';
import LegalSection from '~/components/sections/LegalSection.vue';
import { useJobs } from '~/composables/useJobs';
import { useGeolocation } from '~/composables/useGeolocation';

const route = useRoute();

const jobs = ref<any[]>([]);
const jobsLoading = ref(true);
const geoError = ref<string | null>(null);
const geoLoading = ref(false);
const isNearbyMode = ref(false);
const categories = ref<any[]>([]);
const selectedCategory = ref<string | null>(null);

const filteredJobs = ref<any[]>([]);

const handleFindNearby = async () => {
  geoError.value = null;
  geoLoading.value = true;
  isNearbyMode.value = false;

  try {
    const geo = useGeolocation();
    await geo.getCurrentPosition();

    if (geo.state.value.error) {
      geoError.value = geo.state.value.error;
      return;
    }

    if (!geo.state.value.latitude || !geo.state.value.longitude) {
      geoError.value = 'Could not retrieve your location. Please try again.';
      return;
    }

    isNearbyMode.value = true;
    jobsLoading.value = true;

    const response = await useJobs().findNearbyJobs(
      geo.state.value.latitude,
      geo.state.value.longitude,
      10
    );

    // Map nearby results to full job details with distance
    const nearbyJobIds = (response.jobs ?? []).map((j: any) => j.job_id);
    const distances = new Map((response.jobs ?? []).map((j: any) => [j.job_id, j.distance_km]));

    if (nearbyJobIds.length > 0) {
      // Fetch full job details for nearby jobs using public API
      const fullJobsResponse = await useJobs().listPublicJobs(50);
      const allJobs = (fullJobsResponse.jobs ?? []) as any[];
      jobs.value = allJobs
        .filter((job) => nearbyJobIds.includes(job.id))
        .map((job) => ({
          ...job,
          distance_km: distances.get(job.id) ?? 0
        }));
      filteredJobs.value = jobs.value;
    } else {
      jobs.value = [];
      filteredJobs.value = [];
    }
  } catch (error: any) {
    geoError.value = error?.data?.statusMessage || 'Failed to find nearby jobs. Please try again.';
  } finally {
    jobsLoading.value = false;
    geoLoading.value = false;
  }
};

const loadJobs = async () => {
  jobsLoading.value = true;
  isNearbyMode.value = false;
  geoError.value = null;

  try {
    const response = await useJobs().listPublicJobs(50, selectedCategory.value || undefined);
    jobs.value = (response.jobs ?? []) as any[];
    filteredJobs.value = jobs.value;
  } catch (error) {
    console.error('Failed to load jobs:', error);
    jobs.value = [];
    filteredJobs.value = [];
  } finally {
    jobsLoading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const response = await useJobs().listCategories();
    categories.value = response.categories || [];
  } catch (error) {
    console.error('Failed to load categories:', error);
    categories.value = [];
  }
};

const filterByCategory = (categoryId: string) => {
  if (selectedCategory.value === categoryId) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = categoryId;
  }
  loadJobs();
};

const clearCategoryFilter = () => {
  selectedCategory.value = null;
  loadJobs();
};

onMounted(() => {
  if (route.query.category && typeof route.query.category === 'string') {
    selectedCategory.value = route.query.category;
  }
  loadCategories();
  loadJobs();
});
</script>

<style scoped>
.public-jobs-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.public-jobs-page__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: center;
}

.public-jobs-page__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.job-skeleton-card {
  height: 180px;
}

.public-jobs-page__header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.public-jobs-page__location-btn {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 10px 20px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  display: inline-block;
  cursor: pointer;
  font: inherit;
}

.public-jobs-page__location-btn:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.public-jobs-page__location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.public-jobs-page__geo-error {
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.public-jobs-page__geo-error p {
  margin: 0;
  color: var(--color-danger-700);
}

.public-jobs-page__retry-btn {
  background: var(--color-danger-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.public-jobs-page__retry-btn:hover {
  background: var(--color-danger-700);
}

.public-jobs-page__nearby-banner {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.public-jobs-page__nearby-banner p {
  margin: 0;
  color: var(--color-primary-700);
}

.public-jobs-page__clear-btn {
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.public-jobs-page__clear-btn:hover {
  background: var(--color-primary-700);
}

.empty-state__cta {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  padding: 10px 20px;
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  display: inline-block;
  cursor: pointer;
  font: inherit;
}

.empty-state__cta:hover {
  background: var(--color-surface-muted);
}

.public-jobs-page__categories {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

.category-pill:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
  color: var(--color-primary-700);
}

.category-pill.active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.category-pill__check {
  flex-shrink: 0;
}

.category-pill--clear {
  background: transparent;
  border-color: var(--color-border);
  color: var(--color-danger-600);
  font-weight: 500;
}

.category-pill--clear:hover {
  background: var(--color-danger-50);
  border-color: var(--color-danger-200);
  color: var(--color-danger-700);
}

@media (max-width: 768px) {
  .public-jobs-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .public-jobs-page__header-actions {
    width: 100%;
  }

  .public-jobs-page__nearby-banner,
  .public-jobs-page__geo-error {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
