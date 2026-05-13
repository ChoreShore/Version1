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
