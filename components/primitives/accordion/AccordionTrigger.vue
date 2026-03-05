<template>
  <button
    class="accordion__trigger"
    role="button"
    type="button"
    :id="triggerId"
    :aria-controls="contentId"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    <span class="accordion__trigger-label">
      <slot />
    </span>
    <span class="accordion__chevron" :class="{ 'is-open': isOpen }" aria-hidden="true">⌃</span>
  </button>
</template>

<script setup lang="ts">
import { useAccordionItemContext } from './itemContext';

const { triggerId, contentId, isOpen, toggle } = useAccordionItemContext('AccordionTrigger');
</script>

<style scoped>
.accordion__trigger {
  width: 100%;
  border: none;
  background: transparent;
  padding: var(--space-4) var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  font-weight: 600;
  font-size: var(--text-base);
}

.accordion__chevron {
  transition: transform 0.2s ease;
}

.accordion__chevron.is-open {
  transform: rotate(180deg);
}
</style>
