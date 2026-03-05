<template>
  <div class="role-switcher" role="group" :aria-label="ariaLabel">
    <button
      v-for="option in normalizedOptions"
      :key="option.value"
      type="button"
      class="role-switcher__option"
      :class="{ 'is-active': currentValue === option.value }"
      :aria-pressed="currentValue === option.value"
      @click="select(option.value)"
    >
      <span class="role-switcher__label">{{ option.label }}</span>
      <span v-if="option.description" class="role-switcher__description">
        {{ option.description }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
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
  get: () => props.modelValue ?? props.options[0]?.value,
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
</script>

<style scoped>
.role-switcher {
  display: inline-grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 6px;
  padding: 4px;
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
}

.role-switcher__option {
  border: none;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 10px;
  text-align: left;
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
}

.role-switcher__option:hover {
  background-color: var(--color-surface-muted);
}

.role-switcher__option.is-active {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  box-shadow: inset 0 0 0 1px var(--color-primary-200);
}

.role-switcher__label {
  display: block;
  font-weight: 600;
  font-size: var(--text-sm);
}

.role-switcher__description {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-subtle);
}
</style>
