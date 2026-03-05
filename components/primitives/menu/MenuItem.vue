<template>
  <button
    ref="itemRef"
    class="menu__item"
    role="menuitem"
    type="button"
    @click="handleSelect"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useMenuContext } from './context';

const emit = defineEmits<{ (e: 'select'): void }>();
const { registerItem, unregisterItem, close, closeOnSelect } = useMenuContext('MenuItem');

const itemRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (itemRef.value) {
    registerItem(itemRef.value);
  }
});

onBeforeUnmount(() => {
  if (itemRef.value) {
    unregisterItem(itemRef.value);
  }
});

const handleSelect = () => {
  emit('select');
  if (closeOnSelect) {
    close();
  }
};
</script>

<style scoped>
.menu__item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 8px 16px;
  font-size: var(--text-sm);
  color: var(--color-text);
}

.menu__item:hover,
.menu__item:focus-visible {
  background: var(--color-surface-muted);
}
</style>
