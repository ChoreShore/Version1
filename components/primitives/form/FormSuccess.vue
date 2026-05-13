<template>
  <span class="form-field__success">
    <slot />
  </span>
</template>

<script setup lang="ts">
// No props needed - just displays success indicator
</script>

<style scoped>
.form-field__success {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--color-success-600);
  font-weight: 600;
  margin-top: 2px;
}
</style>
