<template>
  <section class="data-list">
    <header v-if="title || $slots.actions" class="data-list__header">
      <div>
        <p v-if="eyebrow" class="data-list__eyebrow">{{ eyebrow }}</p>
        <h2 v-if="title" class="data-list__title">{{ title }}</h2>
        <p v-if="description" class="data-list__description">{{ description }}</p>
      </div>
      <div class="data-list__actions">
        <slot name="actions" />
      </div>
    </header>

    <ul class="data-list__items" role="list">
      <slot />
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  eyebrow?: string;
  description?: string;
}>();
</script>

<style scoped>
.data-list {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.data-list__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.data-list__eyebrow {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.data-list__title {
  margin: 0;
  font-size: var(--text-lg);
}

.data-list__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.data-list__actions {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
}

.data-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.data-list__items ::v-slotted(li) {
  margin: 0;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.data-list__items ::v-slotted(li:last-child) {
  border-bottom: none;
}
</style>
