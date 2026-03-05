<template>
  <section class="overview-stats">
    <StatCard
      v-for="stat in stats"
      :key="stat.title"
      :title="stat.title"
      :value="stat.value"
      :description="stat.description"
      :icon="stat.icon"
      :trend="stat.trend"
    />
  </section>
</template>

<script setup lang="ts">
import StatCard from '~/components/primitives/StatCard.vue';

defineProps<{
  stats: Array<{
    title: string;
    value: string;
    description?: string;
    icon?: string;
    trend?: {
      value: string;
      label?: string;
      variant?: 'up' | 'down';
    };
  }>;
}>();
</script>

<style scoped>
.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}
</style>
