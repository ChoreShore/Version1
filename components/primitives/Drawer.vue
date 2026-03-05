<template>
  <Teleport to="body">
    <transition name="drawer-slide">
      <div v-if="isOpen" class="drawer" role="dialog" :aria-modal="true" :aria-labelledby="titleId">
        <div class="drawer__overlay" @click="handleOverlayClick"></div>
        <section class="drawer__panel" :class="[`placement-${placement}`, `size-${size}`]" ref="panelRef" tabindex="-1">
          <header class="drawer__header">
            <div>
              <p v-if="eyebrow" class="drawer__eyebrow">{{ eyebrow }}</p>
              <h2 class="drawer__title" :id="titleId">{{ title }}</h2>
              <p v-if="description" class="drawer__description">{{ description }}</p>
            </div>
            <button type="button" class="drawer__close" aria-label="Close" @click="close">×</button>
          </header>
          <div class="drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="drawer__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description?: string;
    eyebrow?: string;
    placement?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg';
    closeOnOverlay?: boolean;
  }>(),
  {
    placement: 'right',
    size: 'md',
    closeOnOverlay: true
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void; (e: 'open'): void; (e: 'close'): void }>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const titleId = `drawer-title-${useId()}`;
const panelRef = ref<HTMLElement | null>(null);

const close = () => {
  if (isOpen.value) {
    isOpen.value = false;
    emit('close');
  }
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close();
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
  }
};

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      emit('open');
      nextTick(() => panelRef.value?.focus());
      document.addEventListener('keydown', onKeydown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', onKeydown);
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.drawer {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.drawer__overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
}

.drawer__panel {
  position: absolute;
  top: 0;
  bottom: 0;
  width: min(480px, 100%);
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-md);
}

.drawer__panel.placement-right {
  right: 0;
}

.drawer__panel.placement-left {
  left: 0;
}

.drawer__panel.size-sm {
  width: min(360px, 100%);
}

.drawer__panel.size-lg {
  width: min(640px, 100%);
}

.drawer__header,
.drawer__footer {
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.drawer__footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.drawer__title {
  margin: 0;
  font-size: var(--text-xl);
}

.drawer__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.drawer__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-subtle);
}

.drawer__close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-slide-enter-from,
.drawer-slide-leave-to {
  opacity: 0;
}
</style>
