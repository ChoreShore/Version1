import { z } from 'zod';
import { validateSchema } from './validation';

// Sign-in validation schema
export const SignInSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
});

// Sign-up form validation schema (includes confirmPassword for UI validation)
export const SignUpFormSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  
  username: z.string()
    .min(1, 'Username is required')
    .max(12, 'Username must be at most 12 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),

  postcode: z.string()
    .min(4, 'Postcode must be at least 4 characters')
    .max(10, 'Postcode must be less than 10 characters')
    .trim(),

  role: z.enum(['employer', 'worker'], {
    message: 'Role is required'
  }),

  age_confirmation: z.boolean()
    .refine((val) => val === true, {
      message: 'You must confirm you are 18+ and legally allowed to use this platform'
    })
    .optional(),

  terms_agreement: z.boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy'
    })
    .optional(),

  tax_responsibility: z.boolean()
    .refine((val) => val === true, {
      message: 'You must understand your responsibility for complying with UK laws and tax obligations'
    })
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Sign-up API schema (matches actual API usage - no confirmPassword)
export const SignUpSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  username: z.string()
    .min(1, 'Username is required')
    .max(12, 'Username must be at most 12 characters')
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),

  postcode: z.string()
    .min(4, 'Postcode must be at least 4 characters')
    .max(10, 'Postcode must be less than 10 characters')
    .trim(),

  role: z.enum(['employer', 'worker'], {
    message: 'Role must be either employer or worker'
  })
});

// Password reset schema
export const PasswordResetSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

// Add role schema
export const AddRoleSchema = z.object({
  role: z.enum(['employer', 'worker'], {
    message: 'Role must be either employer or worker'
  })
});

// Update email schema (for authenticated users)
export const UpdateEmailSchema = z.object({
  newEmail: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  confirmEmail: z.string()
    .min(1, 'Please confirm your email'),

  currentPassword: z.string()
    .min(1, 'Current password is required')
}).refine((data) => data.newEmail === data.confirmEmail, {
  message: "Email addresses don't match",
  path: ['confirmEmail']
});

// Update password schema (for authenticated users)
export const UpdatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),

  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string()
    .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"]
});

// Recovery update password schema (for password reset via email link)
export const RecoveryUpdatePasswordSchema = z.object({
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),

  confirmPassword: z.string()
    .min(1, 'Please confirm your new password')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Delete account schema (requires confirmation)
export const DeleteAccountSchema = z.object({
  confirmation: z.string()
    .refine((val) => val === 'DELETE', {
      message: 'Please type DELETE to confirm'
    }),
  
  password: z.string()
    .min(1, 'Password is required to delete your account')
});

// Re-export Role type for convenience
export { RoleSchema, type Role } from './role';

// Type exports
export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignUpFormInput = z.infer<typeof SignUpFormSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type AddRoleInput = z.infer<typeof AddRoleSchema>;
export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
export type RecoveryUpdatePasswordInput = z.infer<typeof RecoveryUpdatePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;

// Validation helper functions
export const validateSignIn = (data: unknown) => validateSchema(SignInSchema, data);
export const validateSignUpForm = (data: unknown) => validateSchema(SignUpFormSchema, data);
export const validateSignUp = (data: unknown) => validateSchema(SignUpSchema, data);
export const validatePasswordReset = (data: unknown) => validateSchema(PasswordResetSchema, data);
export const validateUpdateEmail = (data: unknown) => validateSchema(UpdateEmailSchema, data);
export const validateRecoveryUpdatePassword = (data: unknown) => validateSchema(RecoveryUpdatePasswordSchema, data);
export const validateAddRole = (data: unknown) => validateSchema(AddRoleSchema, data);
