<template>
  <div class="menu-root">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provideMenuContext } from './context';

const props = withDefaults(
  defineProps<{
    closeOnSelect?: boolean;
  }>(),
  {
    closeOnSelect: true
  }
);

const isOpen = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const items = ref<HTMLElement[]>([]);
const triggerId = `menu-trigger-${useId()}`;
const contentId = `menu-content-${useId()}`;

const registerItem = (el: HTMLElement) => {
  items.value = [...items.value, el];
};

const unregisterItem = (el: HTMLElement) => {
  items.value = items.value.filter((item) => item !== el);
};

const focusNext = (direction: 1 | -1) => {
  if (!items.value.length) return;
  const activeEl = document.activeElement as HTMLElement | null;
  let index = items.value.findIndex((el) => el === activeEl);
  if (index === -1) {
    index = direction === 1 ? -1 : 0;
  }
  const nextIndex = (index + direction + items.value.length) % items.value.length;
  items.value[nextIndex]?.focus();
};

const open = () => {
  if (!isOpen.value) {
    isOpen.value = true;
  }
};

const close = () => {
  if (isOpen.value) {
    isOpen.value = false;
    triggerRef.value?.focus();
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusNext(1);
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusNext(-1);
  }
};

watch(isOpen, (openState) => {
  if (openState) {
    document.addEventListener('keydown', handleKeydown);
    nextTick(() => focusNext(1));
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

provideMenuContext({
  isOpen,
  triggerId,
  contentId,
  triggerRef,
  contentRef,
  focusNext,
  registerItem,
  unregisterItem,
  closeOnSelect: props.closeOnSelect,
  open,
  close
});
</script>

<style scoped>
.menu-root {
  display: inline-block;
  position: relative;
}
</style>
