import { ref, computed, watch, onMounted } from 'vue';
import type { Role } from '~/schemas/role';

const STORAGE_KEY = 'active-role';

// Shared state module-level ref to persist across component instances
const sharedRole = ref<Role>('employer');

// Fetch user's actual roles from their profile
async function fetchUserRoles(): Promise<Role[]> {
  try {
    const response = await $fetch<{ user?: { roles?: Role[] } }>('/api/auth/me');
    return response.user?.roles || [];
  } catch (error) {
    console.error('Failed to fetch user roles:', error);
    return [];
  }
}

// Initialize from localStorage on module load (for UX persistence only)
// SECURITY: This is only for UI state. Authorization is validated server-side.
if (typeof window !== 'undefined') {
  try {
    const savedRole = localStorage.getItem(STORAGE_KEY);
    if (savedRole && (savedRole === 'employer' || savedRole === 'worker')) {
      // Validate that the user actually has this role before setting it
      fetchUserRoles().then((userRoles) => {
        if (userRoles.includes(savedRole as Role)) {
          sharedRole.value = savedRole as Role;
        } else {
          // Fall back to first available role or default
          sharedRole.value = userRoles[0] || 'employer';
        }
      });
    }
  } catch (err) {
    // Ignore localStorage errors
  }
}

export const useActiveRole = () => {
  const role = sharedRole;

  const setRole = async (newRole: Role) => {
    // Validate that the user actually has this role before allowing the switch
    const userRoles = await fetchUserRoles();
    if (!userRoles.includes(newRole)) {
      console.warn(`User does not have role: ${newRole}. Available roles:`, userRoles);
      return;
    }

    role.value = newRole;
    // Persist to localStorage for UX only (does not affect authorization)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newRole);
      } catch (err) {
        // Ignore localStorage errors
      }
    }
  };

  // Sync with localStorage changes from other tabs
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = async (e: StorageEvent) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          const newRole = e.newValue;
          if (newRole === 'employer' || newRole === 'worker') {
            // Validate the role before accepting it
            const userRoles = await fetchUserRoles();
            if (userRoles.includes(newRole as Role)) {
              role.value = newRole as Role;
            }
          }
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  });

  const isEmployer = computed(() => role.value === 'employer');
  const isWorker = computed(() => role.value === 'worker');

  return {
    role,
    setRole,
    isEmployer,
    isWorker
  };
};
