<template>
  <button
    class="tabs__trigger"
    role="tab"
    type="button"
    :id="triggerId"
    :aria-controls="panelId"
    :aria-selected="isActive"
    :tabindex="isActive ? 0 : -1"
    @click="activate"
    @keydown="onKeydown"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useTabsContext } from './context';

const props = defineProps<{ value: string }>();
const { value, registerTab, orientation } = useTabsContext('TabsTrigger');

const triggerId = `tab-${props.value}`;
const panelId = `tabpanel-${props.value}`;

onMounted(() => registerTab(props.value));

const isActive = computed(() => value.value === props.value);

const activate = () => {
  if (!isActive.value) {
    value.value = props.value;
  }
};

const onKeydown = (event: KeyboardEvent) => {
  const keys = orientation.value === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
  if (!keys.includes(event.key)) {
    return;
  }
  event.preventDefault();
  const triggers = Array.from(
    (event.currentTarget as HTMLElement)
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []
  );
  const currentIndex = triggers.findIndex((el) => el.id === triggerId);
  if (currentIndex === -1) {
    return;
  }
  const delta = event.key === keys[0] ? -1 : 1;
  let nextIndex = (currentIndex + delta + triggers.length) % triggers.length;
  const nextTrigger = triggers[nextIndex];
  nextTrigger?.focus();
  nextTrigger?.click();
};
</script>

<style scoped>
.tabs__trigger {
  border: none;
  background: transparent;
  padding: 10px 18px;
  border-radius: var(--radius-pill);
  font-weight: 600;
  color: var(--color-text-subtle);
  transition: background 0.2s ease, color 0.2s ease;
}

.tabs__trigger[aria-selected='true'] {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
</style>
