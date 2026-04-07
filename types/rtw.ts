import type { RtwVerifyInput, RtwApiResponse } from '~/schemas/rtw';

export type RtwStatus = 'unverified' | 'verified' | 'rejected';

export type RtwOutcome =
  | 'ACCEPTED'
  | 'REJECTED'
  | 'NOT_FOUND'
  | 'SHARE_CODE_LOCKED'
  | 'SHARE_CODE_EXPIRED';

export type { RtwVerifyInput, RtwApiResponse };

export interface RtwProfileFields {
  rtw_status: RtwStatus;
  rtw_expiry_date: string | null;
  rtw_verified_at: string | null;
  rtw_full_name: string | null;
}

export interface RtwVerifyResult {
  success: boolean;
  outcome: RtwOutcome;
  name?: string;
  expiry_date?: string;
  message?: string;
}
