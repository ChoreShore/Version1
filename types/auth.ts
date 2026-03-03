import type { Role } from './role';

export type { Role };

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
}

export interface AddRolePayload {
  role: Role;
}

export interface ResetPasswordPayload {
  email: string;
}
