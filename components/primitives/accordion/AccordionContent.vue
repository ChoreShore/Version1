<template>
  <section
    class="accordion__content"
    role="region"
    :id="contentId"
    :aria-labelledby="triggerId"
    v-show="isOpen"
  >
    <slot />
  </section>
</template>

<script setup lang="ts">
import { useAccordionItemContext } from './itemContext';

const { triggerId, contentId, isOpen } = useAccordionItemContext('AccordionContent');
</script>

<style scoped>
.accordion__content {
  padding: 0 var(--space-5) var(--space-5);
  color: var(--color-text-subtle);
}
</style>
