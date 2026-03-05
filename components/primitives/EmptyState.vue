<template>
  <section class="empty-state">
    <div class="empty-state__icon" v-if="$slots.icon || icon">
      <slot name="icon">
        <span aria-hidden="true">{{ icon }}</span>
      </slot>
    </div>
    <div class="empty-state__body">
      <p v-if="eyebrow" class="empty-state__eyebrow">{{ eyebrow }}</p>
      <h2 class="empty-state__title">{{ title }}</h2>
      <p v-if="description" class="empty-state__description">{{ description }}</p>
      <div class="empty-state__actions">
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    description?: string;
    eyebrow?: string;
    icon?: string;
  }>(),
  {
    description: '',
    eyebrow: ''
  }
);
</script>

<style scoped>
.empty-state {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-6);
  text-align: center;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.empty-state__icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.empty-state__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.empty-state__title {
  margin: 0;
  font-size: var(--text-2xl);
}

.empty-state__description {
  margin: 0;
  color: var(--color-text-subtle);
  max-width: 36ch;
}

.empty-state__actions {
  display: inline-flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
