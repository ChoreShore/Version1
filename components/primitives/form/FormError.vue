<template>
  <p v-if="shouldShow" class="form-field__error" :id="errorId" role="alert">
    <slot>{{ externalError }}</slot>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFormFieldContext } from './context';

const { errorId, registerError, externalError } = useFormFieldContext('FormError');

const shouldShow = computed(() => Boolean(externalError.value) || !!useSlots().default);

onMounted(() => registerError(true));

onBeforeUnmount(() => registerError(false));
</script>

<style scoped>
.form-field__error {
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-danger);
}
</style>
