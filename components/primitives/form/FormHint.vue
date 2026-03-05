<template>
  <p v-if="showHint" class="form-field__hint" :id="hintId">
    <slot />
  </p>
</template>

<script setup lang="ts">
import { useFormFieldContext } from './context';

const { hintId, registerHint } = useFormFieldContext('FormHint');

const showHint = computed(() => true);

onMounted(() => registerHint(true));

onBeforeUnmount(() => registerHint(false));
</script>

<style scoped>
.form-field__hint {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
}
</style>
