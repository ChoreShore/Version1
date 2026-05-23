<template>
  <div v-if="isWorker" class="rtw-settings">
    <header class="rtw-settings__header">
      <h2>Right to work</h2>
      <p class="rtw-settings__subtitle">Optional: verify your UK right to work to earn a verified badge and stand out to employers.</p>
    </header>

    <div class="rtw-settings__body">
      <div v-if="rtwLoading" class="rtw-settings__loading">Loading status...</div>

      <div v-else-if="rtwStatus === 'verified' && !isExpired" class="rtw-settings__verified">
        <span class="rtw-settings__badge rtw-settings__badge--verified">Verified</span>
        <p v-if="rtwExpiryDate" class="rtw-settings__expiry">
          Valid until {{ formattedExpiry }}
        </p>
      </div>

      <div v-else-if="rtwStatus === 'verified' && isExpired" class="rtw-settings__expired">
        <span class="rtw-settings__badge rtw-settings__badge--expired">Expired</span>
        <p class="rtw-settings__expiry">
          Your verification expired on {{ formattedExpiry }}. Please re-verify.
        </p>
        <button type="button" class="settings-action-button" @click="showModal = true">
          Re-verify right to work
        </button>
      </div>

      <div v-else class="rtw-settings__unverified">
        <span class="rtw-settings__badge rtw-settings__badge--unverified">Not verified</span>
        <button type="button" class="settings-action-button" @click="showModal = true">
          Verify your right to work
        </button>
      </div>
    </div>

    <RtwVerificationModal
      v-if="showModal"
      @verified="handleVerified"
      @close="showModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRtw } from '~/composables/useRtw';
import { useActiveRole } from '~/composables/useActiveRole';
import { formatDate } from '~/server/utils/dateFormat';
import RtwVerificationModal from '~/components/profile/RtwVerificationModal.vue';

const { isWorker } = useActiveRole();
const { rtwStatus, rtwExpiryDate, rtwLoading, isExpired, fetchRtwStatus } = useRtw();
const showModal = ref(false);

const formattedExpiry = computed(() => {
  if (!rtwExpiryDate.value) return '';
  return new Date(rtwExpiryDate.value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
});

const handleVerified = () => {
  showModal.value = false;
  fetchRtwStatus();
};

onMounted(() => {
  if (isWorker.value) {
    fetchRtwStatus();
  }
});
</script>

<style scoped>
.rtw-settings {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  background: var(--color-surface);
}

.rtw-settings__header h2 {
  margin: 0;
}

.rtw-settings__subtitle {
  margin: var(--space-2) 0 0;
  color: var(--color-text-muted);
}

.rtw-settings__body {
  margin-top: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
}

.rtw-settings__loading {
  color: var(--color-text-muted);
}

.rtw-settings__verified,
.rtw-settings__expired,
.rtw-settings__unverified {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
}

.rtw-settings__badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 600;
}

.rtw-settings__badge--verified {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success);
}

.rtw-settings__badge--expired {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
}

.rtw-settings__badge--unverified {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.rtw-settings__expiry {
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
