import type { Role } from './role';

export type { Role };

// Existing auth types...
export interface SignUpPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: Role;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  roles: Role[];
  created_at: string;
  updated_at: string;
  rtw_status: 'unverified' | 'verified' | 'rejected';
  rtw_expiry_date: string | null;
  rtw_verified_at: string | null;
  rtw_full_name: string | null;
}

export interface AddRolePayload {
  role: Role;
}

export interface ResetPasswordPayload {
  email: string;
}