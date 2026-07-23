<script setup lang="ts">
import { provideTabsContext } from './context';

type Orientation = 'horizontal' | 'vertical';

export interface TabsRootProps {
  /** Controlled active tab value */
  modelValue?: string;
  /** Initial active tab value */
  defaultValue?: string;
  /** Tab orientation */
  orientation?: Orientation;
}

const props = withDefaults(defineProps<TabsRootProps>(), {
  orientation: 'horizontal'
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const value = ref(props.modelValue ?? props.defaultValue ?? '');

watch(
  () => props.modelValue,
  (newVal) => {
    if (typeof newVal === 'string') {
      value.value = newVal;
    }
  }
);

watch(value, (next) => {
  emit('update:modelValue', next);
});

const registerTab = (tabValue: string) => {
  if (!value.value) {
    value.value = tabValue;
  }
};

const orientation = computed(() => props.orientation);
provideTabsContext({ value, registerTab, orientation });

const orientationClass = computed(() => orientation.value);
</script>

<template>
  <div class="tabs" :class="[`orientation-${orientationClass}`]">
    <slot />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.orientation-vertical {
  flex-direction: row;
}
</style>
