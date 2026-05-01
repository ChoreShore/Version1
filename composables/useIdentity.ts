import { ref, computed, onMounted, watch } from 'vue';
import { DiditSdk } from '@didit-protocol/sdk-web';
import type { DiditSdkState, VerificationResult } from '@didit-protocol/sdk-web';
import type { IdentityStatus, IdentityVerificationRecord } from '~/types/identity';

const identityStatus = ref<IdentityStatus>('unverified');
const isLoading = ref(false);
const lastSessionId = ref<string | null>(null);
const lastError = ref<string | null>(null);

export function useIdentity() {
  const user = useSupabaseUser();

  const isVerified = computed(() => identityStatus.value === 'verified');

  const fetchStatus = () => {
    const meta = user.value?.user_metadata ?? {};
    const record = meta.identity_verification as IdentityVerificationRecord | undefined;
    identityStatus.value = record?.status ?? 'unverified';
    lastSessionId.value = record?.sessionId ?? null;
  };

  const recordResult = async (status: IdentityStatus, sessionId: string) => {
    const result = await $fetch<{ success: boolean; status: IdentityStatus; sessionId: string }>('/api/identity/record', {
      method: 'POST',
      body: { status, sessionId, verifiedAt: new Date().toISOString() }
    });
    identityStatus.value = result.status;
    lastSessionId.value = result.sessionId;
  };

  const startVerification = async () => {
    isLoading.value = true;
    lastError.value = null;

    const config = useRuntimeConfig();
    const url = config.public.diditUnilinkUrl as string;

    if (!url) {
      lastError.value = 'Didit is not configured';
      isLoading.value = false;
      throw new Error('DIDIT_UNILINK_URL is not set');
    }

    DiditSdk.shared.startVerification({
      url,
      configuration: {
        closeModalOnComplete: false,
        loggingEnabled: import.meta.dev
      }
    });
  };

  const closeVerification = () => {
    DiditSdk.shared.close();
    isLoading.value = false;
  };

  const reset = () => {
    identityStatus.value = 'unverified';
    lastSessionId.value = null;
    lastError.value = null;
    isLoading.value = false;
  };

  onMounted(() => {
    fetchStatus();

    DiditSdk.shared.onStateChange = (state: DiditSdkState) => {
      if (state === 'idle') isLoading.value = false;
    };

    DiditSdk.shared.onComplete = async (result: VerificationResult) => {
      isLoading.value = false;

      if (result.type === 'completed' && result.session) {
        const status = mapDiditStatus(result.session.status);
        const sessionId = result.session.sessionId;
        await recordResult(status, sessionId);
      } else if (result.type === 'failed' && result.error) {
        lastError.value = result.error.message;
      }
    };

    DiditSdk.shared.onEvent = (event) => {
      if (import.meta.dev) {
        console.log('Didit event:', event.type, event.data);
      }
    };
  });

  watch(user, fetchStatus, { immediate: true });

  return {
    identityStatus,
    isLoading,
    isVerified,
    lastSessionId,
    lastError,
    fetchStatus,
    startVerification,
    closeVerification,
    reset
  };
}

function mapDiditStatus(status: string): IdentityStatus {
  switch (status) {
    case 'Approved':
      return 'verified';
    case 'Declined':
      return 'declined';
    case 'In Review':
    case 'Pending':
      return 'in_review';
    default:
      return 'unverified';
  }
}
