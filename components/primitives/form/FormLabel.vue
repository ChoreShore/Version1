<script setup lang="ts">
import { useFormFieldContext } from './context';

const { fieldId } = useFormFieldContext('FormLabel');
</script>

<template>
  <label class="form-field__label" :for="fieldId">
    <slot />
  </label>
</template>

<style scoped>
.form-field__label {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text);
}
</style>
