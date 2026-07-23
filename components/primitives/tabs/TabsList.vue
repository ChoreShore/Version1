<script setup lang="ts">
export interface TabsListProps {
  /** Tab list orientation */
  orientation?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<TabsListProps>(), {
  orientation: 'horizontal'
});

const orientation = computed(() => props.orientation);
</script>

<template>
  <div class="tabs__list" role="tablist" :aria-orientation="orientation">
    <slot />
  </div>
</template>

<style scoped>
.tabs__list {
  display: inline-flex;
  gap: var(--space-2);
  padding: var(--space-1);
  background: var(--color-surface-muted);
  border-radius: var(--radius-pill);
}

:host(.orientation-vertical) .tabs__list {
  flex-direction: column;
}
</style>
