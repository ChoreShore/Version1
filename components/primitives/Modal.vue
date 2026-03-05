<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" :aria-describedby="description ? descriptionId : undefined">
        <div class="modal__overlay" @click="handleOverlayClick"></div>
        <div class="modal__panel" :class="[`size-${size}`]" ref="panelRef" tabindex="-1">
          <header class="modal__header">
            <div>
              <p v-if="eyebrow" class="modal__eyebrow">{{ eyebrow }}</p>
              <h2 class="modal__title" :id="titleId">{{ title }}</h2>
              <p v-if="description" class="modal__description" :id="descriptionId">{{ description }}</p>
            </div>
            <button type="button" class="modal__close" aria-label="Close" @click="close">×</button>
          </header>
          <section class="modal__body">
            <slot />
          </section>
          <footer v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </footer>
        </div>
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
    size?: 'sm' | 'md' | 'lg';
    closeOnOverlay?: boolean;
  }>(),
  {
    size: 'md',
    closeOnOverlay: true
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void; (e: 'close'): void; (e: 'open'): void }>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const titleId = `modal-title-${useId()}`;
const descriptionId = `modal-description-${useId()}`;
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

const trapFocus = (event: KeyboardEvent) => {
  if (!isOpen.value || event.key !== 'Tab') {
    return;
  }

  const focusable = panelRef.value?.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable || focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(
  () => isOpen.value,
  (open) => {
    if (open) {
      emit('open');
      nextTick(() => panelRef.value?.focus());
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('keydown', trapFocus);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    close();
  }
};

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('keydown', trapFocus);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.modal__overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.modal__panel {
  position: relative;
  z-index: 1;
  width: min(640px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.modal__panel.size-sm {
  width: min(420px, 100%);
}

.modal__panel.size-lg {
  width: min(860px, 100%);
}

.modal__header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.modal__title {
  margin: 0;
  font-size: var(--text-xl);
}

.modal__eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.modal__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-subtle);
}

.modal__close {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
}

.modal__body {
  padding: var(--space-5);
  flex: 1;
}

.modal__footer {
  padding: var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
