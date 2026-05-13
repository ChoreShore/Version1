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
      <p v-if="explanation" class="empty-state__explanation">{{ explanation }}</p>
      <div v-if="tips && tips.length" class="empty-state__tips">
        <p class="empty-state__tips-title">💡 Tips:</p>
        <ul class="empty-state__tips-list">
          <li v-for="(tip, index) in tips" :key="index">{{ tip }}</li>
        </ul>
      </div>
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
    explanation?: string;
    tips?: string[];
  }>(),
  {
    description: '',
    eyebrow: '',
    explanation: '',
    tips: () => []
  }
);
</script>

<style scoped>
.empty-state {
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-6);
  text-align: center;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.empty-state__icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--hover);
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
  color: var(--muted);
}

.empty-state__title {
  margin: 0;
  font-size: var(--text-2xl);
}

.empty-state__description {
  margin: 0;
  color: var(--muted);
  max-width: 36ch;
}

.empty-state__actions {
  display: inline-flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.empty-state__explanation {
  margin: var(--space-2) 0 0 0;
  color: var(--muted);
  font-size: var(--text-sm);
  font-style: italic;
}

.empty-state__tips {
  margin-top: var(--space-4);
  text-align: left;
  background: var(--hover);
  padding: var(--space-3);
  border-radius: var(--radius-md);
}

.empty-state__tips-title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
}

.empty-state__tips-list {
  margin: 0;
  padding-left: 1.2rem;
  color: var(--muted);
  font-size: var(--text-sm);
}

.empty-state__tips-list li {
  margin-bottom: var(--space-1);
}
</style>
