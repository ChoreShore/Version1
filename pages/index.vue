<template>
  <div class="homepage">
    <!-- Category Nav -->
    <nav class="category-nav" aria-label="Job category filters">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.id"
        :to="`/jobs?category=${cat.id}`"
        class="category-nav__item"
        :class="{ active: activeCategory === cat.id }"
        @click.prevent="filterByCategory(cat.id)"
        :aria-label="`Filter by ${cat.name} jobs`"
        :aria-pressed="activeCategory === cat.id"
      >
        <component :is="catIcon(cat.name)" class="category-nav__icon" :size="16" />
        <span class="category-nav__label">{{ cat.name }}</span>
      </NuxtLink>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-scroll">
        <div class="hero-card hero-card--dark">
          <div class="hero-card__icon"><Zap :size="28" /></div>
          <h2 class="hero-card__title">Get help</h2>
          <p class="hero-card__text">Post a job and get responses within minutes</p>
          <NuxtLink to="/jobs/new" class="btn btn--on-dark" aria-label="Post a new job">
            <span class="btn__plus">+</span> Post a job
          </NuxtLink>
        </div>
        <div class="hero-card hero-card--light">
          <div class="hero-card__icon"><Circle :size="28" /></div>
          <h2 class="hero-card__title">Find work</h2>
          <p class="hero-card__text">Browse nearby jobs and start earning today</p>
          <NuxtLink to="/jobs/public" class="btn btn--on-light" aria-label="Find available jobs">
            <span class="btn__dot">●</span> Find jobs
          </NuxtLink>
        </div>
        <div class="hero-card hero-card--light">
          <div class="hero-card__icon"><Users :size="28" /></div>
          <h2 class="hero-card__title">Hire workers</h2>
          <p class="hero-card__text">Browse trusted workers and hire help today</p>
          <NuxtLink to="/workers/public" class="btn btn--on-light" aria-label="Find workers to hire">
            <span class="btn__dot">●</span> Find workers
          </NuxtLink>
        </div>
      </div>
      <div class="hero-scroll-hint" aria-hidden="true">
        <span class="scroll-hint__text">Swipe to see more</span>
        <ChevronRight :size="16" class="scroll-hint__icon" />
      </div>
    </section>

    <!-- Stats Bar -->
    <section class="stats-bar">
      <div class="stat-item">
        <span class="stat-item__icon"><Star :size="18" /></span>
        <span class="stat-item__value">{{ formatStat(stats?.jobs_completed_this_week) }}+</span>
        <span class="stat-item__label">jobs completed this week</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__icon"><Flame :size="18" /></span>
        <span class="stat-item__value">{{ formatStat(stats?.jobs_posted_today) }}+</span>
        <span class="stat-item__label">jobs posted today</span>
      </div>
      <div class="stat-item">
        <span class="stat-item__icon"><Shield :size="18" /></span>
        <span class="stat-item__value">Escrow</span>
        <span class="stat-item__label">protected payments</span>
      </div>
    </section>

    <!-- Filters -->
    <div class="filters" role="group" aria-label="Job filters">
      <button
        v-for="f in filters"
        :key="f.id"
        class="filter-pill"
        :class="{ active: activeFilter === f.id }"
        @click="applyFilter(f.id)"
        :aria-label="`Filter by ${f.label}`"
        :aria-pressed="activeFilter === f.id"
      >
        <component :is="getFilterIcon(f.icon)" class="filter-pill__icon" :size="14" />
        <span>{{ f.label }}</span>
      </button>
    </div>

    <!-- Job Listings -->
    <section class="jobs-section">
      <div class="jobs-section__header">
        <h2 class="jobs-section__title"><Flame :size="20" class="section-icon" /> Happening now</h2>
        <NuxtLink to="/jobs/public" class="jobs-section__link">View all jobs →</NuxtLink>
      </div>

      <div v-if="loading" class="job-grid">
        <div v-for="n in 4" :key="`sk-${n}`" class="job-card skeleton">
          <LoadingSkeleton variant="block" height="20px" width="60px" class="skeleton__pill" />
          <LoadingSkeleton variant="block" height="24px" width="80%" class="skeleton__title" />
          <LoadingSkeleton variant="block" height="28px" width="40%" class="skeleton__price" />
          <LoadingSkeleton variant="block" height="16px" width="30%" class="skeleton__meta" />
          <LoadingSkeleton variant="block" height="20px" width="50%" class="skeleton__tags" />
          <LoadingSkeleton variant="block" height="36px" width="100%" class="skeleton__cta" />
        </div>
      </div>

      <div v-else-if="displayedJobs.length" class="job-grid">
        <article v-for="job in displayedJobs" :key="job.id" class="job-card">
          <div class="job-card__header">
            <StatusPill
              v-if="cardTopPill(job)"
              :label="cardTopPill(job)?.label"
              :variant="cardTopPill(job)?.variant as any"
            />
            <button
              class="job-card__save"
              :class="{ saved: isSaved(job.id) }"
              @click="toggleSave(job.id)"
              aria-label="Save job"
            >
              <Heart :size="20" :class="{ filled: isSaved(job.id) }" />
            </button>
          </div>

          <h3 class="job-card__title">{{ job.title }}</h3>
          <p class="job-card__price">
            {{ job.budget_type === 'hourly' ? `£${job.budget_amount}/hr` : `£${job.budget_amount.toLocaleString()}` }}
          </p>

          <div class="job-card__meta">
            <span class="job-card__time">{{ job.posted_at_relative }}</span>
            <span v-if="job.postcode_area" class="job-card__location">📍 {{ job.postcode_area }}</span>
          </div>

          <div class="job-card__tags">
            <InfoBadge
              v-for="tag in job.tags.slice(0, 2)"
              :key="tag"
              :label="tag"
              variant="neutral"
            />
          </div>

          <NuxtLink :to="`/jobs/${job.id}`" class="btn btn--full btn--card">
            View details
          </NuxtLink>
        </article>
      </div>

      <div v-else class="empty-state">
        <p>No jobs available right now. Be the first to post one!</p>
        <NuxtLink to="/jobs/new" class="btn btn--primary">Post the first job</NuxtLink>
      </div>
    </section>

    <!-- Content Sections -->
    <TrustSection />
    <HowItWorksSection />
    <EarningSection />
    <AudienceSection />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSupabaseUser } from '#imports';
import { Zap, Circle, Users, Star, Flame, Shield, Heart, Laptop, Brush, Truck, Hammer, Package, Home, MapPin, ChevronRight } from '@lucide/vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import InfoBadge from '~/components/primitives/InfoBadge.vue';
import TrustSection from '~/components/sections/TrustSection.vue';
import HowItWorksSection from '~/components/sections/HowItWorksSection.vue';
import EarningSection from '~/components/sections/EarningSection.vue';
import AudienceSection from '~/components/sections/AudienceSection.vue';
import LegalSection from '~/components/sections/LegalSection.vue';

const user = useSupabaseUser();

// Redirect authenticated users to dashboard
watch(() => user.value, (u) => {
  if (u) navigateTo('/dashboard', { replace: true });
}, { immediate: true });

definePageMeta({
  layout: 'public',
  title: 'HireBeHired — Find Local Jobs & Hire Help'
});

const jobsApi = useJobs();

// Search
const searchQuery = ref('');
const locationQuery = ref('');

// Categories
const categories = ref<{ id: string; name: string }[]>([
  { id: 'home-help', name: 'Home Help' },
  { id: 'moving', name: 'Moving' },
  { id: 'handyman', name: 'Handyman' },
  { id: 'pet-care', name: 'Pet Care' },
  { id: 'delivery', name: 'Delivery' },
  { id: 'remote-work', name: 'Remote Work' }
]);
const activeCategory = ref<string | null>(null);

// Stats
const stats = ref<{ jobs_completed_this_week: number; jobs_posted_today: number; escrow_protected_payments: number } | null>(null);

// Jobs
const allJobs = ref<any[]>([]);
const loading = ref(true);

// Filters
const filters = [
  { id: 'nearby', label: 'Nearby', icon: '📍' },
  { id: 'remote', label: 'Remote', icon: 'laptop' },
  { id: 'cleaning', label: 'Cleaning', icon: 'brush' },
  { id: 'moving', label: 'Moving', icon: 'truck' },
  { id: 'handyman', label: 'Handyman', icon: 'hammer' }
];
const activeFilter = ref<string | null>(null);

// Saved jobs (client-side only)
const savedJobIds = ref<Set<string>>(new Set());

const displayedJobs = computed(() => {
  let jobs = allJobs.value;
  if (activeCategory.value) {
    jobs = jobs.filter((j) => j.category_id === activeCategory.value);
  }
  if (activeFilter.value === 'nearby') {
    // No distance data for now; just show all
  }
  if (activeFilter.value === 'remote') {
    jobs = jobs.filter((j) => !j.postcode_area || j.postcode_area.toLowerCase().includes('remote'));
  }
  if (activeFilter.value && ['cleaning', 'moving', 'handyman'].includes(activeFilter.value)) {
    const nameMap: Record<string, string> = {
      cleaning: 'cleaning',
      moving: 'moving',
      handyman: 'handyman'
    };
    const target = nameMap[activeFilter.value];
    jobs = jobs.filter((j) => j.category_name?.toLowerCase().includes(target));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    jobs = jobs.filter((j) => j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
  }
  return jobs;
});

function getFilterIcon(iconName: string) {
  const iconMap: Record<string, any> = {
    '📍': MapPin,
    'laptop': Laptop,
    'brush': Brush,
    'truck': Truck,
    'hammer': Hammer
  };
  return iconMap[iconName] ?? Circle;
}
function catIcon(name: string) {
  const iconMap: Record<string, any> = {
    'Home Help': Home,
    'Moving': Truck,
    'Handyman': Hammer,
    'Pet Care': Heart,
    'Delivery': Package,
    'Remote Work': Laptop
  };
  return iconMap[name] ?? Circle;
}

function filterByCategory(id: string) {
  activeCategory.value = activeCategory.value === id ? null : id;
}

function applyFilter(id: string) {
  activeFilter.value = activeFilter.value === id ? null : id;
}

function cardTopPill(job: any) {
  if (job.is_urgent) return { label: 'Urgent', variant: 'warning' };
  const postedMs = Date.now() - new Date(job.created_at).getTime();
  if (postedMs < 24 * 60 * 60 * 1000) return { label: 'New', variant: 'info' };
  return null;
}

function formatStat(n?: number | null) {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function isSaved(id: string) {
  return savedJobIds.value.has(id);
}

function toggleSave(id: string) {
  if (savedJobIds.value.has(id)) {
    savedJobIds.value.delete(id);
  } else {
    savedJobIds.value.add(id);
  }
}

onMounted(async () => {
  try {
    const [jobsRes, statsRes, catRes] = await Promise.all([
      jobsApi.listPublicJobs(12),
      jobsApi.getPublicStats(),
      jobsApi.listCategories().catch(() => ({ categories: [] }))
    ]);
    allJobs.value = jobsRes.jobs || [];
    stats.value = statsRes;
    if (catRes.categories?.length) {
      categories.value = catRes.categories;
    }
  } catch (err) {
    console.error('Homepage load error:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  background: var(--bg);
  font-family: system-ui, -apple-system, sans-serif;
}

/* Header */
.homepage-header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: var(--space-3) var(--space-4);
}

.homepage-header__inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.homepage-logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.homepage-logo__icon {
  font-size: 28px;
}

.homepage-logo__name {
  display: block;
  font-weight: 800;
  font-size: var(--text-lg);
  line-height: 1.2;
}

.homepage-logo__tagline {
  display: block;
  font-size: var(--text-xs);
  color: var(--muted);
}

.homepage-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 280px;
}

.homepage-search__input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  background: var(--surface);
  outline: none;
  transition: border-color 120ms ease;
}

.homepage-search__input:focus {
  border-color: var(--teal);
}

.homepage-search__input--short {
  max-width: 160px;
}

.homepage-search__btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--dark);
  color: white;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.homepage-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* Buttons */
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
  background: var(--dark);
  color: white;
}

.btn--ghost {
  background: transparent;
  color: var(--text);
}

.btn--outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
}

.btn--on-dark {
  background: white;
  color: var(--dark);
}

.btn--on-light {
  background: var(--dark);
  color: white;
}

.btn--full {
  width: 100%;
}

.btn--card {
  margin-top: auto;
  border-radius: var(--radius-lg);
  padding: 14px;
}

.btn__plus,
.btn__dot {
  font-size: 16px;
}

/* Category Nav */
.category-nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.category-nav::-webkit-scrollbar {
  height: 6px;
}

.category-nav::-webkit-scrollbar-track {
  background: transparent;
}

.category-nav::-webkit-scrollbar-thumb {
  background-color: var(--color-border);
  border-radius: 3px;
}

.category-nav::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-muted);
}

.category-nav__item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
  cursor: pointer;
  scroll-snap-align: start;
  flex-shrink: 0;
}

.category-nav__item:hover {
  background: var(--color-hover);
  border-color: var(--color-muted);
}

.category-nav__item.active {
  background: var(--color-mint);
  border-color: var(--color-teal);
  color: var(--color-teal);
  font-weight: 600;
}

.category-nav__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Hero */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  position: relative;
}

.hero-scroll {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.hero-card {
  padding: var(--space-6);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 200px;
  flex-shrink: 0;
}

.hero-card--dark {
  background: var(--color-dark);
  color: var(--color-white);
}

.hero-card--light {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.hero-card__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
}

.hero-card--light .hero-card__icon {
  background: var(--color-hover);
}

.hero-card__title {
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0;
}

.hero-card__text {
  font-size: var(--text-sm);
  color: inherit;
  opacity: 0.9;
  margin: 0;
  line-height: 1.5;
}

.hero-card--light .hero-card__text {
  color: var(--color-muted);
}

.hero-card .btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 600;
  text-decoration: none;
  transition: background 150ms ease;
}

.hero-scroll-hint {
  display: none;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--color-muted);
  animation: fadeHint 2s ease-in-out infinite;
}

@keyframes fadeHint {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.scroll-hint__text {
  font-size: var(--text-xs);
}

.scroll-hint__icon {
  animation: slideRight 1s ease-in-out infinite;
}

@keyframes slideRight {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(4px); }
}

@media (max-width: 768px) {
  .hero-scroll {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    -webkit-overflow-scrolling: touch;
  }

  .hero-card {
    min-width: 280px;
    max-width: 320px;
    scroll-snap-align: start;
    min-height: 180px;
  }

  .hero-scroll-hint {
    display: flex;
  }

  .hero-card__title {
    font-size: var(--text-lg);
  }

  .hero-card__text {
    font-size: var(--text-xs);
  }
}

/* Stats Bar */
.stats-bar {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.stat-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 600;
}

.stat-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.stat-item__value {
  color: var(--text);
}

.stat-item__label {
  color: var(--muted);
  font-weight: 500;
}

/* Filters */
.filters {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-2) var(--space-4);
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
}

.filters::-webkit-scrollbar {
  display: none;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Jobs Section */
.jobs-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4);
}

.jobs-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.jobs-section__title {
  font-size: var(--text-xl);
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
}

.section-icon {
  display: inline-flex;
  align-items: center;
  margin-right: var(--space-2);
}

.jobs-section__link {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--teal);
  text-decoration: none;
}

/* Job Grid */
.job-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

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
  font-size: var(--text-base);
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.job-card__price {
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

/* Skeleton */
.skeleton {
  pointer-events: none;
}

.skeleton__pill,
.skeleton__title,
.skeleton__price,
.skeleton__meta,
.skeleton__tags,
.skeleton__cta {
  background: var(--border);
  border-radius: var(--radius-md);
  animation: pulse 1.5s infinite ease-in-out;
}

.skeleton__pill {
  width: 60px;
  height: 22px;
}

.skeleton__title {
  width: 85%;
  height: 18px;
  margin-top: 4px;
}

.skeleton__price {
  width: 50px;
  height: 24px;
}

.skeleton__meta {
  width: 70%;
  height: 14px;
}

.skeleton__tags {
  width: 60%;
  height: 22px;
}

.skeleton__cta {
  width: 100%;
  height: 44px;
  margin-top: auto;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--muted);
}

.empty-state p {
  margin-bottom: var(--space-4);
}

/* Footer */
.homepage-footer {
  text-align: center;
  padding: var(--space-6);
  color: var(--muted);
  font-size: var(--text-sm);
  border-top: 1px solid var(--border);
}

/* Responsive */
@media (max-width: 1024px) {
  .job-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .homepage-header__inner {
    flex-direction: column;
    align-items: stretch;
  }

  .homepage-search {
    min-width: unset;
  }

  .homepage-search__input--short {
    max-width: 100px;
  }

  .homepage-header__actions {
    justify-content: center;
  }

  .hero {
    grid-template-columns: 1fr;
  }

  .stats-bar {
    grid-template-columns: 1fr;
  }

  .job-grid {
    grid-template-columns: 1fr;
  }
}
</style>
