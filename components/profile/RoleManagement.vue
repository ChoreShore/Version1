<template>
  <div class="role-management">
    <header>
      <h3>Your roles</h3>
      <p class="role-management__hint">Add roles to access different features</p>
    </header>

    <div class="role-management__current">
      <p class="role-management__label">Current roles:</p>
      <div class="role-management__badges">
        <span v-if="hasEmployerRole" class="role-badge role-badge--employer">
          Employer
        </span>
        <span v-if="hasWorkerRole" class="role-badge role-badge--worker">
          Worker
        </span>
        <span v-if="!hasEmployerRole && !hasWorkerRole" class="role-management__empty">
          No roles assigned
        </span>
      </div>
    </div>

    <div class="role-management__actions">
      <button
        v-if="!hasWorkerRole"
        @click="addRole('worker')"
        :disabled="loading"
        class="role-button role-button--worker"
      >
        {{ loading ? 'Adding...' : '+ Add Worker role' }}
      </button>
      
      <button
        v-if="!hasEmployerRole"
        @click="addRole('employer')"
        :disabled="loading"
        class="role-button role-button--employer"
      >
        {{ loading ? 'Adding...' : '+ Add Employer role' }}
      </button>
    </div>

    <p v-if="error" class="role-management__error">{{ error }}</p>
    <p v-if="success" class="role-management__success">{{ success }}</p>

    <div class="role-management__info">
      <p><strong>Worker role:</strong> Apply to jobs, manage applications, receive reviews</p>
      <p><strong>Employer role:</strong> Post jobs, review applications, hire workers</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Role } from '~/schemas/role';

const { addRole: addRoleApi } = useAuth();
const user = useSupabaseUser();
const client = useSupabaseClient();

const userRoles = ref<Role[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const hasWorkerRole = computed(() => userRoles.value.includes('worker'));
const hasEmployerRole = computed(() => userRoles.value.includes('employer'));

const fetchUserRoles = async () => {
  if (!user.value) return;
  
  try {
    const { data, error: fetchError } = await client
      .from('profiles')
      .select('roles')
      .eq('id', user.value.id)
      .single();
    
    if (fetchError) throw fetchError;
    
    userRoles.value = data?.roles || [];
  } catch (err: any) {
    console.error('Failed to fetch roles:', err);
  }
};

const addRole = async (role: Role) => {
  error.value = null;
  success.value = null;
  loading.value = true;

  try {
    const result = await addRoleApi(role);
    userRoles.value = result;
    success.value = `${role.charAt(0).toUpperCase() + role.slice(1)} role added successfully!`;
    
    setTimeout(() => {
      success.value = null;
    }, 3000);
  } catch (err: any) {
    error.value = err.data?.statusMessage || `Failed to add ${role} role`;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserRoles();
});
</script>

<style scoped>
.role-management {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.role-management header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.role-management h3 {
  margin: 0;
  font-size: var(--text-lg);
}

.role-management__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.role-management__current {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.role-management__label {
  margin: 0;
  font-weight: 600;
  font-size: var(--text-sm);
}

.role-management__badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.role-badge {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
}

.role-badge--employer {
  background: #e6f0ff;
  color: var(--color-primary-600);
}

.role-badge--worker {
  background: #d1f4e0;
  color: var(--color-success);
}

.role-management__empty {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-style: italic;
}

.role-management__actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.role-button {
  padding: var(--space-3) var(--space-4);
  border: 2px solid;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.role-button--worker {
  border-color: var(--color-success);
  color: var(--color-success);
}

.role-button--worker:hover:not(:disabled) {
  background: var(--color-success);
  color: white;
}

.role-button--employer {
  border-color: var(--color-primary-500);
  color: var(--color-primary-500);
}

.role-button--employer:hover:not(:disabled) {
  background: var(--color-primary-500);
  color: white;
}

.role-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.role-management__error {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.role-management__success {
  margin: 0;
  padding: var(--space-2);
  background: var(--color-success-light);
  color: var(--color-success);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.role-management__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}

.role-management__info p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.role-management__info strong {
  color: var(--color-text);
}
</style>
