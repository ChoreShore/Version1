<template>
  <div class="data-grid">
    <header v-if="title || $slots.actions" class="data-grid__header">
      <div>
        <p v-if="eyebrow" class="data-grid__eyebrow">{{ eyebrow }}</p>
        <h2 v-if="title" class="data-grid__title">{{ title }}</h2>
        <p v-if="description" class="data-grid__description">{{ description }}</p>
      </div>
      <div class="data-grid__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="data-grid__table-wrapper" role="region" :aria-label="title">
      <table class="data-grid__table">
        <thead>
          <tr>
            <slot name="head" />
          </tr>
        </thead>
        <tbody>
          <slot />
        </tbody>
      </table>
    </div>

    <footer v-if="$slots.footer" class="data-grid__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  eyebrow?: string;
  description?: string;
}>();
</script>

<style scoped>
.data-grid {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.data-grid__header,
.data-grid__footer {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.data-grid__footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}

.data-grid__eyebrow {
  margin: 0 0 var(--space-1);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.data-grid__title {
  margin: 0;
  font-size: var(--text-lg);
}

.data-grid__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.data-grid__actions {
  display: inline-flex;
  gap: var(--space-3);
  align-items: center;
}

.data-grid__table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.data-grid__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-grid__table thead {
  background-color: var(--color-surface-muted);
}

.data-grid__table th,
.data-grid__table td {
  padding: var(--space-4) var(--space-5);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.data-grid__table th {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.data-grid__table tbody tr:hover {
  background-color: var(--color-surface-muted);
}

@media (max-width: 640px) {
  .data-grid__table th,
  .data-grid__table td {
    padding: var(--space-3);
  }
}
</style>
