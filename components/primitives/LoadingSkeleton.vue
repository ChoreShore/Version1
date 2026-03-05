<template>
  <div class="skeleton" :class="[`skeleton-${variant}`]" :style="style"></div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    width?: string;
    height?: string;
    variant?: 'text' | 'circle' | 'block';
  }>(),
  {
    variant: 'text'
  }
);

const style = computed(() => ({
  width: props.width,
  height: props.height
}));
</script>

<style scoped>
@keyframes pulse {
  0% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.4;
  }
}

.skeleton {
  background: linear-gradient(90deg, #f4f6fb 25%, #e9edf5 37%, #f4f6fb 63%);
  background-size: 400% 100%;
  animation: pulse 1.6s ease-in-out infinite;
  border-radius: var(--radius-sm);
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
