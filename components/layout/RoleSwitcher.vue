<template>
  <div class="role-switcher" role="group" :aria-label="ariaLabel">
    <button
      class="role-switcher__help"
      @click="toggleHelp"
      aria-label="Show help about role switching"
      :aria-expanded="showHelp"
    >
      <HelpCircle :size="16" />
    </button>
    <div class="role-switcher__tooltip" :class="{ 'is-visible': showTooltip || showHelp }">
      Switch between Employer and Worker views to manage jobs or find work
      <button class="role-switcher__tooltip-close" @click="showHelp = false" aria-label="Close help">
        <X :size="14" />
      </button>
    </div>
    <button
      v-for="option in normalizedOptions"
      :key="option.value"
      type="button"
      class="role-switcher__option"
      :class="{ 'is-active': currentValue === option.value }"
      :aria-pressed="currentValue === option.value"
      :aria-label="`Switch to ${option.label} view${option.description ? `: ${option.description}` : ''}`"
      @click="select(option.value)"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      @focus="showTooltip = true"
      @blur="showTooltip = false"
    >
      <span class="role-switcher__label">{{ option.label }}</span>
      <span v-if="option.description" class="role-switcher__description">
        {{ option.description }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { HelpCircle, X } from '@lucide/vue';

type RoleOption = {
  label: string;
  value: string;
  description?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options?: RoleOption[];
    ariaLabel?: string;
  }>(),
  {
    ariaLabel: 'Switch role',
    options: () => [
      { label: 'Employer', value: 'employer', description: 'Post jobs and review applicants' },
      { label: 'Worker', value: 'worker', description: 'Apply to jobs and message employers' }
    ]
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void; (e: 'change', value: string): void }>();

const normalizedOptions = computed(() => props.options);
const currentValue = computed({
  get: () => {
    // If modelValue is provided and exists in options, use it
    if (props.modelValue && props.options.some(opt => opt.value === props.modelValue)) {
      return props.modelValue;
    }
    // Otherwise fall back to first option
    return props.options[0]?.value;
  },
  set: (value: string) => {
    emit('update:modelValue', value);
    emit('change', value);
  }
});

const select = (value: string) => {
  if (value !== currentValue.value) {
    currentValue.value = value;
  }
};

const showTooltip = ref(false);
const showHelp = ref(false);

const toggleHelp = () => {
  showHelp.value = !showHelp.value;
  showTooltip.value = false;
};
</script>

<style scoped>
.role-switcher {
  position: relative;
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  width: 100%;
  max-width: 280px;
  min-width: 0;
}

.role-switcher__help {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: color 150ms ease, background 150ms ease;
  flex-shrink: 0;
}

.role-switcher__help:hover {
  color: var(--color-text);
  background: var(--color-hover);
}

.role-switcher__help:focus-visible {
  outline: 2px solid var(--color-dark);
  outline-offset: 2px;
}

.role-switcher__option {
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  padding: var(--space-3) var(--space-4);
  text-align: left;
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
  flex: 1;
  cursor: pointer;
}

.role-switcher__option:hover {
  background-color: var(--color-hover);
}

.role-switcher__option:focus-visible {
  outline: 2px solid var(--color-dark);
  outline-offset: 2px;
  z-index: 1;
}

.role-switcher__option.is-active {
  background: var(--color-hover);
  color: var(--color-text);
  box-shadow: inset 0 0 0 1px var(--color-border);
}

.role-switcher__label {
  display: block;
  font-weight: 600;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.role-switcher__description {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.role-switcher__tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-dark);
  color: var(--color-white);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 150ms ease, visibility 150ms ease;
  pointer-events: none;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.role-switcher__tooltip.is-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.role-switcher__tooltip-close {
  background: none;
  border: none;
  color: var(--color-white);
  cursor: pointer;
  padding: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 150ms ease;
}

.role-switcher__tooltip-close:hover {
  opacity: 1;
}

.role-switcher__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--color-dark);
}

.role-switcher__tooltip.is-visible {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 480px) {
  .role-switcher {
    width: auto;
    max-width: none;
  }

  .role-switcher__option {
    flex: 1 0 auto;
    padding: var(--space-2) var(--space-3);
  }

  .role-switcher__description {
    display: block;
    font-size: 0.65rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 80px;
  }
  
  .role-switcher__tooltip {
    white-space: normal;
    max-width: 200px;
  }
}
</style>
