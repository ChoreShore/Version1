import { ref, computed } from 'vue';
import type { Role } from '~/schemas/role';

const globalRole = ref<Role>('employer');

export const useActiveRole = () => {
  const role = computed({
    get: () => globalRole.value,
    set: (value: Role) => {
      globalRole.value = value;
    }
  });

  const setRole = (newRole: Role) => {
    globalRole.value = newRole;
  };

  const isEmployer = computed(() => globalRole.value === 'employer');
  const isWorker = computed(() => globalRole.value === 'worker');

  return {
    role,
    setRole,
    isEmployer,
    isWorker
  };
};
