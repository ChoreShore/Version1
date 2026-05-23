<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <h1>Account settings</h1>
      <p class="settings-page__subtitle">Manage your account preferences and security</p>
    </header>

    <div class="settings-page__content">
      <section class="settings-section">
        <PhotoSettingsSection />
      </section>

      <section class="settings-section">
        <BioSettingsSection />
      </section>

      <section class="settings-section">
        <RoleManagement />
      </section>

      <section class="settings-section">
        <RtwSettingsSection />
      </section>

      <section class="settings-section">
        <IdentitySettingsSection />
      </section>

      <section class="settings-section">
        <div class="payment-methods">
          <header class="payment-methods__header">
            <h2>Mock payment connections</h2>
            <p>Connect and verify card/bank methods for both employer and worker flows.</p>
          </header>

          <div v-if="paymentMethodsLoading" class="payment-methods__loading">Loading payment methods...</div>
          <p v-else-if="paymentMethodsError" class="payment-methods__error">{{ paymentMethodsError }}</p>

          <div v-else class="payment-methods__roles">
            <article v-for="role in roles" :key="role" class="payment-role-card">
              <header class="payment-role-card__header">
                <h3>{{ roleLabel(role) }}</h3>
              </header>

              <div v-for="methodType in methodTypes" :key="`${role}-${methodType}`" class="payment-method-row">
                <div>
                  <p class="payment-method-row__name">{{ methodTypeLabel(methodType) }}</p>
                  <p class="payment-method-row__meta">{{ describeMethod(role, methodType) }}</p>
                </div>

                <div class="payment-method-row__status">
                  <StatusPill :label="connectionLabel(role, methodType)" :variant="connectionVariant(role, methodType)" />
                  <StatusPill :label="verificationLabel(role, methodType)" :variant="verificationVariant(role, methodType)" />
                </div>

                <div class="payment-method-row__actions">
                  <button
                    type="button"
                    class="settings-action-button"
                    :disabled="isMutating(role, methodType)"
                    @click="handlePrimaryAction(role, methodType)"
                  >
                    {{ primaryActionLabel(role, methodType) }}
                  </button>

                  <button
                    v-if="canDisconnect(role, methodType)"
                    type="button"
                    class="settings-action-button settings-action-button--secondary"
                    :disabled="isMutating(role, methodType)"
                    @click="disconnectMethod(role, methodType)"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <UpdatePasswordForm />
      </section>

      <section class="settings-section settings-section--danger">
        <DeleteAccountForm />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import RoleManagement from '~/components/profile/RoleManagement.vue';
import RtwSettingsSection from '~/components/profile/RtwSettingsSection.vue';
import IdentitySettingsSection from '~/components/profile/IdentitySettingsSection.vue';
import PhotoSettingsSection from '~/components/profile/PhotoSettingsSection.vue';
import BioSettingsSection from '~/components/profile/BioSettingsSection.vue';
import UpdatePasswordForm from '~/components/profile/UpdatePasswordForm.vue';
import DeleteAccountForm from '~/components/profile/DeleteAccountForm.vue';
import StatusPill from '~/components/primitives/StatusPill.vue';
import { usePaymentMethods } from '~/composables/usePaymentMethods';
import type { PaymentMethodInput, PaymentMethodType } from '~/schemas/payment';
import type { Role } from '~/schemas/role';

const user = useSupabaseUser();
const router = useRouter();
const paymentMethodsApi = usePaymentMethods();

const roles: Role[] = ['employer', 'worker'];
const methodTypes: PaymentMethodType[] = ['card', 'bank'];
const paymentMethods = ref<PaymentMethodInput[]>([]);
const paymentMethodsLoading = ref(true);
const paymentMethodsError = ref<string | null>(null);
const mutatingKey = ref<string | null>(null);

const keyFor = (role: Role, methodType: PaymentMethodType) => `${role}:${methodType}`;

const fetchPaymentMethods = async () => {
  paymentMethodsLoading.value = true;
  paymentMethodsError.value = null;
  try {
    const response = await paymentMethodsApi.listMethods();
    paymentMethods.value = response.methods ?? [];
  } catch (error: any) {
    paymentMethodsError.value = error?.data?.statusMessage || 'Unable to load payment methods. Please check your connection and try again.';
  } finally {
    paymentMethodsLoading.value = false;
  }
};

const getMethod = (role: Role, methodType: PaymentMethodType) =>
  paymentMethods.value.find(method => method.role === role && method.method_type === methodType) ?? null;

const roleLabel = (role: Role) => role === 'employer' ? 'Employer methods' : 'Worker methods';
const methodTypeLabel = (methodType: PaymentMethodType) => methodType === 'card' ? 'Card' : 'Bank account';

const describeMethod = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  if (!method) return 'Not connected';
  if (method.display_label) return method.display_label;
  if (method.last4) return `•••• ${method.last4}`;
  return `${methodTypeLabel(methodType)} connected`;
};

const connectionLabel = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  return method?.connection_status ?? 'disconnected';
};

const verificationLabel = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  return method?.verification_status ?? 'pending';
};

const connectionVariant = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  return method?.connection_status === 'connected' ? 'success' : 'neutral';
};

const verificationVariant = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  return method?.verification_status === 'verified' ? 'success' : 'warning';
};

const isMutating = (role: Role, methodType: PaymentMethodType) => mutatingKey.value === keyFor(role, methodType);

const canDisconnect = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  return Boolean(method && method.connection_status === 'connected');
};

const primaryActionLabel = (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  if (!method || method.connection_status === 'disconnected') return 'Connect';
  if (method.verification_status !== 'verified') return 'Verify';
  return 'Connected';
};

const connectMethod = async (role: Role, methodType: PaymentMethodType) => {
  mutatingKey.value = keyFor(role, methodType);
  paymentMethodsError.value = null;
  try {
    await paymentMethodsApi.connectMethod({
      role,
      method_type: methodType,
      brand: methodType === 'card' ? 'Visa' : undefined,
      last4: methodType === 'card' ? '4242' : undefined,
      display_label: methodType === 'card' ? 'Visa ending 4242' : 'Mock bank account'
    });
    await fetchPaymentMethods();
  } catch (error: any) {
    paymentMethodsError.value = error?.data?.statusMessage || 'Unable to connect payment method. Please check your connection and try again.';
  } finally {
    mutatingKey.value = null;
  }
};

const verifyMethod = async (role: Role, methodType: PaymentMethodType) => {
  mutatingKey.value = keyFor(role, methodType);
  paymentMethodsError.value = null;
  try {
    await paymentMethodsApi.verifyMethod({ role, method_type: methodType });
    await fetchPaymentMethods();
  } catch (error: any) {
    paymentMethodsError.value = error?.data?.statusMessage || 'Unable to verify payment method. Please check your connection and try again.';
  } finally {
    mutatingKey.value = null;
  }
};

const disconnectMethod = async (role: Role, methodType: PaymentMethodType) => {
  mutatingKey.value = keyFor(role, methodType);
  paymentMethodsError.value = null;
  try {
    await paymentMethodsApi.disconnectMethod({ role, method_type: methodType });
    await fetchPaymentMethods();
  } catch (error: any) {
    paymentMethodsError.value = error?.data?.statusMessage || 'Unable to disconnect payment method. Please check your connection and try again.';
  } finally {
    mutatingKey.value = null;
  }
};

const handlePrimaryAction = async (role: Role, methodType: PaymentMethodType) => {
  const method = getMethod(role, methodType);
  if (!method || method.connection_status === 'disconnected') {
    await connectMethod(role, methodType);
    return;
  }

  if (method.verification_status !== 'verified') {
    await verifyMethod(role, methodType);
  }
};

onMounted(() => {
  if (!user.value) {
    router.push('/auth/sign-in');
    return;
  }

  fetchPaymentMethods();
});
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6);
}

.settings-page__header {
  margin-bottom: var(--space-8);
}

.settings-page__header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--text-2xl);
  font-weight: 700;
}

.settings-page__subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-base);
}

.settings-page__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.settings-section {
  width: 100%;
}

.payment-methods {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
}

.payment-methods__header h2 {
  margin: 0;
}

.payment-methods__header p {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.payment-methods__loading {
  margin-top: var(--space-4);
  color: var(--color-text-muted);
}

.payment-methods__error {
  margin-top: var(--space-4);
  color: var(--color-danger);
}

.payment-methods__roles {
  margin-top: var(--space-4);
  display: grid;
  gap: var(--space-4);
}

.payment-role-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.payment-role-card__header h3 {
  margin: 0;
}

.payment-method-row {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  display: grid;
  grid-template-columns: minmax(140px, 1fr) auto auto;
  gap: var(--space-3);
  align-items: center;
}

.payment-method-row__name {
  margin: 0;
  font-weight: 600;
}

.payment-method-row__meta {
  margin: 2px 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.payment-method-row__status {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.payment-method-row__actions {
  display: inline-flex;
  gap: 8px;
}

.settings-action-button {
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  background: var(--color-primary-600);
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.settings-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.settings-action-button--secondary {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.settings-section--danger {
  margin-top: var(--space-4);
}

@media (max-width: 768px) {
  .settings-page {
    padding: var(--space-4);
  }

  .payment-method-row {
    grid-template-columns: 1fr;
  }

  .payment-method-row__actions {
    justify-content: flex-start;
  }
}
</style>
