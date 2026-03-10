<template>
  <div class="form-field" :class="[`state-${state}`]">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { provideFormFieldContext } from './context';

const props = withDefaults(
  defineProps<{
    id: string;
    error?: string | null;
    state?: 'default' | 'success' | 'error';
  }>(),
  {
    state: 'default'
  }
);

const hasHint = ref(false);
const hasError = ref(Boolean(props.error));
const externalError = ref(props.error ?? null);

watch(
  () => props.error,
  (next) => {
    externalError.value = next ?? null;
    hasError.value = Boolean(next);
  }
);

const describedBy = computed(() => {
  const ids: string[] = [];
  if (hasHint.value) ids.push(`${props.id}-hint`);
  if (externalError.value || hasError.value) ids.push(`${props.id}-error`);
  return ids.length ? ids.join(' ') : undefined;
});

provideFormFieldContext({
  fieldId: props.id,
  hintId: `${props.id}-hint`,
  errorId: `${props.id}-error`,
  hasHint,
  hasError,
  externalError,
  registerHint: (present) => {
    hasHint.value = present;
  },
  registerError: (present) => {
    hasError.value = present;
  },
  describedBy
});

const state = computed(() => props.state ?? (externalError.value ? 'error' : 'default'));
</script>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
