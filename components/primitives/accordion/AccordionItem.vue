<template>
  <div class="accordion__item">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { provideAccordionItemContext } from './itemContext';
import { useAccordionContext } from './context';

const props = defineProps<{ value: string }>();
const { isItemOpen, toggle } = useAccordionContext('AccordionItem');

const triggerId = `accordion-trigger-${props.value}`;
const contentId = `accordion-content-${props.value}`;
const open = computed(() => isItemOpen(props.value));

provideAccordionItemContext({
  value: props.value,
  isOpen: open,
  triggerId,
  contentId,
  toggle: () => toggle(props.value)
});
</script>

<style scoped>
.accordion__item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}
</style>
