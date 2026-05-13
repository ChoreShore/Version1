<template>
  <div class="role-switcher" role="group" :aria-label="ariaLabel">
    <div class="role-switcher__tooltip" :class="{ 'is-visible': showTooltip }">
      Switch between Employer and Worker views to manage jobs or find work
    </div>
    <button
      v-for="option in normalizedOptions"
      :key="option.value"
      type="button"
      class="role-switcher__option"
      :class="{ 'is-active': currentValue === option.value }"
      :aria-pressed="currentValue === option.value"
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
</script>

<style scoped>
.role-switcher {
  position: relative;
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: var(--radius-lg);
  background-color: var(--surface);
  border: 1px solid var(--border);
  width: 100%;
  max-width: 280px;
  min-width: 0;
}

.role-switcher__option {
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 10px 16px;
  text-align: left;
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
  flex: 1;
  cursor: pointer;
}

.role-switcher__option:hover {
  background-color: var(--hover);
}

.role-switcher__option.is-active {
  background: var(--mint);
  color: var(--teal);
  box-shadow: inset 0 0 0 1px var(--border);
}

.role-switcher__label {
  display: block;
  font-weight: 600;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.role-switcher__description {
  display: block;
  font-size: 0.75rem;
  color: var(--muted);
  white-space: nowrap;
}

.role-switcher__tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--dark);
  color: var(--white);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 150ms ease, visibility 150ms ease;
  pointer-events: none;
  z-index: 100;
}

.role-switcher__tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--dark);
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
    padding: 8px 12px;
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
    display: none;
  }
}
</style>
