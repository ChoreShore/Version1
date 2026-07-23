<script setup lang="ts">
export interface LoadingSkeletonProps {
  /** CSS width */
  width?: string;
  /** CSS height */
  height?: string;
  /** Skeleton shape variant */
  variant?: 'text' | 'circle' | 'block';
}

const props = withDefaults(defineProps<LoadingSkeletonProps>(), {
  variant: 'text'
});

const style = computed(() => ({
  width: props.width,
  height: props.height
}));
</script>

<template>
  <div class="skeleton" :class="[`skeleton-${variant}`]" :style="style"></div>
</template>

<style scoped>
.skeleton {
  background: var(--color-gray-200);
  border-radius: var(--radius-md);
  display: inline-block;
}

.skeleton-text {
  height: 1rem;
  width: 100%;
}

.skeleton-circle {
  border-radius: 50%;
  aspect-ratio: 1/1;
}

.skeleton-block {
  border-radius: var(--radius-md);
}
</style>
