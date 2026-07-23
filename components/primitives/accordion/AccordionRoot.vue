<script setup lang="ts">
import { provideAccordionContext } from './context';

type AccordionType = 'single' | 'multiple';

export interface AccordionRootProps {
  /** Accordion behavior type */
  type?: AccordionType;
  /** Controlled open values */
  modelValue?: string[];
  /** Initial open values */
  defaultValue?: string[];
}

const props = withDefaults(defineProps<AccordionRootProps>(), {
  type: 'single'
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const openValues = ref<string[]>(props.modelValue ?? props.defaultValue ?? []);

watch(
  () => props.modelValue,
  (next) => {
    if (next) {
      openValues.value = next;
    }
  }
);

const toggle = (value: string) => {
  let next: string[] = [];
  if (props.type === 'single') {
    next = openValues.value.includes(value) ? [] : [value];
  } else {
    next = openValues.value.includes(value)
      ? openValues.value.filter((v) => v !== value)
      : [...openValues.value, value];
  }
  openValues.value = next;
  emit('update:modelValue', next);
};

const isItemOpen = (value: string) => openValues.value.includes(value);

provideAccordionContext({ openValues, toggle, isItemOpen, allowMultiple: props.type === 'multiple' });
</script>

<template>
  <div class="accordion">
    <slot />
  </div>
</template>

<style scoped>
.accordion {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
