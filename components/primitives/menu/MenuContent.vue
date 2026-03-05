<template>
  <Teleport to="body">
    <transition name="menu-fade">
      <div
        v-if="isOpen"
        class="menu__content-wrapper"
        @pointerdown.self="close"
      >
        <div
          ref="contentEl"
          class="menu__content"
          role="menu"
          :id="contentId"
          :aria-labelledby="triggerId"
          tabindex="-1"
          :style="style"
        >
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useMenuContext } from './context';

const { isOpen, close, contentRef, contentId, triggerId, triggerRef } = useMenuContext('MenuContent');
const contentEl = ref<HTMLElement | null>(null);
const position = ref({ top: 0, left: 0, width: 0 });

onMounted(() => {
  contentRef.value = contentEl.value;
});

watch(contentEl, (el) => {
  if (el) contentRef.value = el;
});

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      nextTick(() => updatePosition());
    }
  }
);

const updatePosition = () => {
  const trigger = triggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  position.value = {
    top: rect.bottom + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width
  };
};

const style = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  minWidth: `${Math.max(position.value.width, 200)}px`
}));

onMounted(() => {
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
</script>

<style scoped>
.menu__content-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.menu__content {
  position: absolute;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
  padding: var(--space-2) 0;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>
