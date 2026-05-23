import type { Role } from './role';

export type { Role };

// Existing auth types...
export interface SignUpPayload {
  email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
  postcode: string;
  role: Role;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  roles: Role[];
  photo_url: string | null;
  bio: string | null;
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