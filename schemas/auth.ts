import { z } from 'zod';

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
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .trim()
    .optional(),
  
  role: z.enum(['employer', 'worker'], {
    message: 'Role must be either employer or worker'
  }).or(z.literal(''))
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => data.role !== '', {
  message: "Role is required",
  path: ["role"]
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
  
  first_name: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  
  phone: z.string()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be less than 20 characters')
    .trim()
    .optional(),
  
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

// Re-export Role type for convenience
export { RoleSchema, type Role } from './role';

// Type exports
export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignUpFormInput = z.infer<typeof SignUpFormSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type AddRoleInput = z.infer<typeof AddRoleSchema>;

// Validation helper functions
export const validateSignIn = (data: unknown) => {
  try {
    return {
      success: true,
      data: SignInSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};

export const validateSignUpForm = (data: unknown) => {
  try {
    return {
      success: true,
      data: SignUpFormSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};

export const validateSignUp = (data: unknown) => {
  try {
    return {
      success: true,
      data: SignUpSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};

export const validatePasswordReset = (data: unknown) => {
  try {
    return {
      success: true,
      data: PasswordResetSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};

export const validateAddRole = (data: unknown) => {
  try {
    return {
      success: true,
      data: AddRoleSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          const field = err.path[0] as string;
          acc[field] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
};
