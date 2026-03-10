import { z } from 'zod';

// Role schema
export const RoleSchema = z.enum(['employer', 'worker'], {
  message: 'Role must be either employer or worker'
});

// Type export
export type Role = z.infer<typeof RoleSchema>;
