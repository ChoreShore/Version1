<script setup lang="ts">
import { useTabsContext } from './context';

export interface TabsPanelProps {
  /** Tab panel value */
  value: string;
}

const props = defineProps<TabsPanelProps>();
const { value: activeValue } = useTabsContext('TabsPanel');

const panelId = `tabpanel-${props.value}`;
const triggerId = `tab-${props.value}`;

const isActive = computed(() => activeValue.value === props.value);
</script>

<template>
  <section
    class="tabs__panel"
    role="tabpanel"
    tabindex="0"
    :id="panelId"
    :aria-labelledby="triggerId"
    v-show="isActive"
  >
    <slot />
  </section>
</template>

<style scoped>
.tabs__panel {
  display: block;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}
</style>
