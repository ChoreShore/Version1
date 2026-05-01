export type IdentityStatus = 'unverified' | 'verified' | 'in_review' | 'declined';

export interface IdentityVerificationRecord {
  status: IdentityStatus;
  verifiedAt: string | null;
  sessionId: string | null;
}
