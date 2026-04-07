import { ref, computed } from 'vue';
import { useActiveRole } from '~/composables/useActiveRole';
import type { RtwStatus, RtwVerifyInput, RtwVerifyResult } from '~/types/rtw';

const rtwStatus = ref<RtwStatus>('unverified');
const rtwExpiryDate = ref<string | null>(null);
const rtwLoading = ref(false);
const rtwFetched = ref(false);

export const useRtw = () => {
  const { isWorker } = useActiveRole();
  const client = useSupabaseClient();
  const user = useSupabaseUser();

  const isExpired = computed(() => {
    if (!rtwExpiryDate.value) return false;
    return new Date(rtwExpiryDate.value) < new Date();
  });

  const isRtwRequired = computed(
    () => isWorker.value && (rtwStatus.value !== 'verified' || isExpired.value)
  );

  const fetchRtwStatus = async () => {
    if (!user.value || rtwFetched.value) return;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('rtw_status, rtw_expiry_date')
        .eq('id', user.value.id)
        .single();

      if (error) throw error;

      const row = data as any;
      rtwStatus.value = (row?.rtw_status ?? 'unverified') as RtwStatus;
      rtwExpiryDate.value = row?.rtw_expiry_date ?? null;
      rtwFetched.value = true;
    } catch {
      rtwStatus.value = 'unverified';
    }
  };

  const verify = async (payload: RtwVerifyInput): Promise<RtwVerifyResult> => {
    rtwLoading.value = true;
    try {
      const result = await $fetch<RtwVerifyResult>('/api/rtw/verify', {
        method: 'POST',
        body: payload
      });

      if (result.success) {
        rtwStatus.value = 'verified';
        rtwExpiryDate.value = result.expiry_date ?? null;
        rtwFetched.value = true;
      }

      return result;
    } finally {
      rtwLoading.value = false;
    }
  };

  const resetRtwCache = () => {
    rtwFetched.value = false;
    rtwStatus.value = 'unverified';
    rtwExpiryDate.value = null;
  };

  return {
    rtwStatus,
    rtwExpiryDate,
    rtwLoading,
    isExpired,
    isRtwRequired,
    fetchRtwStatus,
    verify,
    resetRtwCache
  };
};
