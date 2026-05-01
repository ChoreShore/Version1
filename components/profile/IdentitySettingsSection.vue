<template>
  <div v-if="isWorker" class="identity-settings">
    <header class="identity-settings__header">
      <h2>Identity verification</h2>
      <p class="identity-settings__subtitle">Optional: verify your identity to increase trust with employers (Only available to UK passport holders)</p>
    </header>

    <div class="identity-settings__body">
      <div v-if="isLoading && !showModal" class="identity-settings__loading">Loading status...</div>

      <div v-else-if="identityStatus === 'verified'" class="identity-settings__verified">
        <span class="identity-settings__badge identity-settings__badge--verified">Verified</span>
        <p v-if="verifiedAt" class="identity-settings__date">
          Verified on {{ formattedDate }}
        </p>
      </div>

      <div v-else-if="identityStatus === 'in_review'" class="identity-settings__in-review">
        <span class="identity-settings__badge identity-settings__badge--in-review">In Review</span>
        <p class="identity-settings__hint">Your verification is being reviewed. This usually takes a few minutes.</p>
      </div>

      <div v-else-if="identityStatus === 'declined'" class="identity-settings__declined">
        <span class="identity-settings__badge identity-settings__badge--declined">Declined</span>
        <p class="identity-settings__hint">Your identity verification was not approved. You may retry.</p>
        <button type="button" class="settings-action-button" @click="showModal = true">
          Retry verification
        </button>
      </div>

      <div v-else class="identity-settings__unverified">
        <span class="identity-settings__badge identity-settings__badge--unverified">Not verified</span>
        <button type="button" class="settings-action-button" @click="showModal = true">
          Verify your identity
        </button>
      </div>
    </div>

    <IdentityVerificationModal
      v-if="showModal"
      @verified="handleVerified"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useActiveRole } from '~/composables/useActiveRole';
import { useIdentity } from '~/composables/useIdentity';
import IdentityVerificationModal from '~/components/profile/IdentityVerificationModal.vue';

const { isWorker } = useActiveRole();
const { identityStatus, isLoading, fetchStatus } = useIdentity();
const showModal = ref(false);

const user = useSupabaseUser();

const verifiedAt = computed(() => {
  const meta = user.value?.user_metadata ?? {};
  return meta.identity_verification?.verifiedAt ?? null;
});

const formattedDate = computed(() => {
  if (!verifiedAt.value) return '';
  return new Date(verifiedAt.value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
});

const handleVerified = () => {
  showModal.value = false;
  fetchStatus();
};

onMounted(() => {
  if (isWorker.value) {
    fetchStatus();
  }
});
</script>

<style scoped>
.identity-settings {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
}

.identity-settings__header h2 {
  margin: 0;
}

.identity-settings__subtitle {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.identity-settings__body {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
}

.identity-settings__loading {
  color: var(--color-text-muted);
}

.identity-settings__verified,
.identity-settings__in-review,
.identity-settings__declined,
.identity-settings__unverified {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.identity-settings__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
}

.identity-settings__badge--verified {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.identity-settings__badge--in-review {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.identity-settings__badge--declined {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}

.identity-settings__badge--unverified {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.identity-settings__date,
.identity-settings__hint {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
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

.settings-action-button:hover {
  background: var(--color-primary-700);
}
</style>
