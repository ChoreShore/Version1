<template>
  <div class="tabs__list" role="tablist" :aria-orientation="orientation">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ orientation?: 'horizontal' | 'vertical' }>(), {
  orientation: 'horizontal'
});

const orientation = computed(() => props.orientation);
</script>

<style scoped>
.tabs__list {
  display: inline-flex;
  gap: var(--space-2);
  padding: 4px;
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

:host(.orientation-vertical) .tabs__list {
  flex-direction: column;
}
</style>
