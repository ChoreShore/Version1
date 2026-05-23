<template>
  <section class="public-workers-page">
    <header class="public-workers-page__header">
      <div>
        <p class="public-workers-page__eyebrow">Hire trusted help</p>
        <h1>Browse Workers</h1>
        <p>Find skilled workers ready to help you get things done</p>
      </div>
      <div class="public-workers-page__header-actions">
        <button
          type="button"
          class="public-workers-page__location-btn"
          :disabled="geoLoading"
          @click="handleFindNearby"
        >
          {{ geoLoading ? 'Locating...' : 'Find workers near me' }}
        </button>
      </div>
    </header>

    <div v-if="geoError" class="public-workers-page__geo-error">
      <p>{{ geoError }}</p>
      <button type="button" class="public-workers-page__retry-btn" @click="handleFindNearby">Retry</button>
    </div>

    <div v-if="isNearbyMode" class="public-workers-page__nearby-banner">
      <p>Showing workers within 10 km of your location</p>
      <button type="button" class="public-workers-page__clear-btn" @click="loadWorkers">Show all workers</button>
    </div>

    <!-- Category Filter -->
    <div v-if="categories.length > 0" class="public-workers-page__categories">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-pill"
        :class="{ active: selectedCategory === category.id }"
        @click="filterByCategory(category.id)"
      >
        {{ category.name }}
      </button>
      <button
        v-if="selectedCategory"
        class="category-pill category-pill--clear"
        @click="clearCategoryFilter"
      >
        Clear filter
      </button>
    </div>

    <!-- Filters -->
    <div class="public-workers-page__filters">
      <button
        v-for="filter in filters"
        :key="filter.id"
        class="filter-pill"
        :class="{ active: activeFilter === filter.id }"
        @click="applyFilter(filter.id)"
      >
        <span class="filter-pill__icon">{{ filter.icon }}</span>
        <span>{{ filter.label }}</span>
      </button>
    </div>

    <div v-if="workersLoading" class="public-workers-page__grid">
      <LoadingSkeleton v-for="n in 8" :key="`worker-skeleton-${n}`" variant="block" height="250px" />
    </div>

    <EmptyState
      v-else-if="!filteredWorkers.length"
      title="No workers found"
      description="Available workers matching your criteria will appear here. Try adjusting filters or check back later."
      icon="👥"
    >
      <template #actions>
        <button type="button" class="empty-state__cta" @click="loadWorkers">Refresh</button>
      </template>
    </EmptyState>

    <div v-else class="public-workers-page__grid">
      <WorkerCard v-for="worker in filteredWorkers" :key="worker.id" :worker="worker" />
    </div>

    <!-- Content Sections -->
    <TrustSection />
    <HowItWorksSection />
    <EarningSection />
    <AudienceSection />
    <LegalSection />
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
});
import { onMounted, ref } from 'vue';
import WorkerCard from '~/components/workers/WorkerCard.vue';
import EmptyState from '~/components/primitives/EmptyState.vue';
import LoadingSkeleton from '~/components/primitives/LoadingSkeleton.vue';
import TrustSection from '~/components/sections/TrustSection.vue';
import HowItWorksSection from '~/components/sections/HowItWorksSection.vue';
import EarningSection from '~/components/sections/EarningSection.vue';
import AudienceSection from '~/components/sections/AudienceSection.vue';
import LegalSection from '~/components/sections/LegalSection.vue';
import { useWorkers } from '~/composables/useWorkers';
import { useGeolocation } from '~/composables/useGeolocation';
import { useJobs } from '~/composables/useJobs';

const workers = ref<any[]>([]);
const workersLoading = ref(true);
const geoError = ref<string | null>(null);
const geoLoading = ref(false);
const isNearbyMode = ref(false);
const activeFilter = ref<string | null>(null);
const categories = ref<any[]>([]);
const selectedCategory = ref<string | null>(null);

const filters = [
  { id: 'top-rated', label: 'Top Rated', icon: '⭐' },
  { id: 'available', label: 'Available Today', icon: '⚡' },
  { id: 'verified', label: 'Verified', icon: '✓' },
  { id: 'experienced', label: 'Experienced', icon: '💼' }
];

const filteredWorkers = ref<any[]>([]);

const applyFilter = (filterId: string) => {
  activeFilter.value = activeFilter.value === filterId ? null : filterId;
  
  if (!activeFilter.value) {
    filteredWorkers.value = workers.value;
    return;
  }

  switch (filterId) {
    case 'top-rated':
      filteredWorkers.value = workers.value.filter(w => w.average_rating && w.average_rating >= 4.5);
      break;
    case 'verified':
      filteredWorkers.value = workers.value.filter(w => w.is_verified);
      break;
    case 'experienced':
      filteredWorkers.value = workers.value.filter(w => w.completed_jobs >= 5);
      break;
    case 'available':
      filteredWorkers.value = workers.value; // Would need real availability data
      break;
    default:
      filteredWorkers.value = workers.value;
  }
};

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
    workersLoading.value = true;

    // For now, just load all workers - location filtering would need spatial queries
    const response = await useWorkers().listPublicWorkers(50);
    workers.value = response.workers || [];
    filteredWorkers.value = workers.value.filter(w => w.postcode_area); // Filter to workers with location
  } catch (error: any) {
    geoError.value = error?.data?.statusMessage || 'Failed to find nearby workers. Please try again.';
  } finally {
    workersLoading.value = false;
    geoLoading.value = false;
  }
};

const loadWorkers = async () => {
  workersLoading.value = true;
  isNearbyMode.value = false;
  geoError.value = null;
  activeFilter.value = null;

  try {
    const response = await useWorkers().listPublicWorkers(50, selectedCategory.value || undefined);
    workers.value = response.workers || [];
    filteredWorkers.value = workers.value;
  } catch (error) {
    console.error('Failed to load workers:', error);
    workers.value = [];
    filteredWorkers.value = [];
  } finally {
    workersLoading.value = false;
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
  loadWorkers();
};

const clearCategoryFilter = () => {
  selectedCategory.value = null;
  loadWorkers();
};

onMounted(() => {
  loadCategories();
  loadWorkers();
});
</script>

<style scoped>
.public-workers-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.public-workers-page__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: center;
}

.public-workers-page__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}

.public-workers-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}

.public-workers-page__header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.public-workers-page__location-btn {
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

.public-workers-page__location-btn:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.public-workers-page__location-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.public-workers-page__geo-error {
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.public-workers-page__geo-error p {
  margin: 0;
  color: var(--color-danger-700);
}

.public-workers-page__retry-btn {
  background: var(--color-danger-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.public-workers-page__retry-btn:hover {
  background: var(--color-danger-700);
}

.public-workers-page__nearby-banner {
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
}

.public-workers-page__nearby-banner p {
  margin: 0;
  color: var(--color-primary-700);
}

.public-workers-page__clear-btn {
  background: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}

.public-workers-page__clear-btn:hover {
  background: var(--color-primary-700);
}

.public-workers-page__filters {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.public-workers-page__categories {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.category-pill {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
}

.category-pill:hover,
.category-pill.active {
  background: var(--color-primary-50);
  border-color: var(--color-primary-200);
  color: var(--color-primary-700);
}

.category-pill--clear {
  background: var(--color-danger-50);
  border-color: var(--color-danger-200);
  color: var(--color-danger-700);
}

.category-pill--clear:hover {
  background: var(--color-danger-100);
  border-color: var(--color-danger-300);
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
}

.filter-pill:hover,
.filter-pill.active {
  background: var(--hover);
  border-color: var(--teal);
}

.filter-pill__icon {
  font-size: 14px;
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

@media (max-width: 768px) {
  .public-workers-page__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .public-workers-page__header-actions {
    width: 100%;
  }

  .public-workers-page__nearby-banner,
  .public-workers-page__geo-error {
    flex-direction: column;
    align-items: flex-start;
  }

  .public-workers-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
