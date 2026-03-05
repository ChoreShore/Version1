<template>
  <button
    ref="triggerEl"
    class="menu__trigger"
    type="button"
    :id="triggerId"
    :aria-controls="contentId"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    @click="toggle"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useMenuContext } from './context';

const { triggerId, contentId, triggerRef, isOpen, open, close } = useMenuContext('MenuTrigger');
const triggerEl = ref<HTMLElement | null>(null);

onMounted(() => {
  triggerRef.value = triggerEl.value;
});

watch(triggerEl, (el) => {
  if (el) triggerRef.value = el;
});

const toggle = () => {
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};
</script>

<style scoped>
.menu__trigger {
  border: none;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
</style>
