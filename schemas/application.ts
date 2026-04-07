import { z } from 'zod';

// Application status enum (lenient for database responses)
export const ApplicationStatusSchema = z.union([
  z.literal('pending'),
  z.literal('accepted'), 
  z.literal('rejected'),
  z.literal('withdrawn')
]);

// Application creation schema (strict for input validation)
export const CreateApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID format'),
  cover_letter: z.string()
    .min(10, 'Cover letter must be at least 10 characters')
    .max(1000, 'Cover letter must be less than 1000 characters')
    .trim()
    .optional(),
  proposed_rate: z.number()
    .min(20, 'Proposed rate must be at least £20')
    .max(30, 'Proposed rate must be no more than £30')
    .optional()
});

// Withdrawal reason enum
export const WithdrawalReasonSchema = z.enum(['found_another_job', 'personal_reasons']);
export type WithdrawalReason = z.infer<typeof WithdrawalReasonSchema>;

// Application update schema (strict for input validation)
export const UpdateApplicationSchema = z.object({
  status: ApplicationStatusSchema.optional(),
  cover_letter: z.string()
    .min(10, 'Cover letter must be at least 10 characters')
    .max(1000, 'Cover letter must be less than 1000 characters')
    .trim()
    .optional(),
  proposed_rate: z.number()
    .min(20, 'Proposed rate must be at least £20')
    .max(30, 'Proposed rate must be no more than £30')
    .optional(),
  withdrawal_reason: WithdrawalReasonSchema.optional()
});

// Full application schema (lenient for database responses)
export const ApplicationSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  worker_id: z.string(),
  cover_letter: z.string().nullable().optional(),
  proposed_rate: z.number().nullable().optional(),
  status: ApplicationStatusSchema,
  withdrawal_reason: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string()
});

// Application with details schema (lenient for database responses)
export const ApplicationWithDetailsSchema = ApplicationSchema.extend({
  job_title: z.string().optional(),
  job_description: z.string().optional(),
  job_location: z.string().optional(),
  job_budget_min: z.number().optional(),
  job_budget_max: z.number().optional(),
  job_budget_amount: z.number().optional(),
  employer_first_name: z.string().optional(),
  employer_last_name: z.string().optional(),
  worker_first_name: z.string().optional(),
  worker_last_name: z.string().optional(),
  // Additional fields for compatibility
  availability_notes: z.string().optional(),
  employer_name: z.string().optional(),
  worker_name: z.string().optional()
});

// API response schemas (lenient for database responses)
export const ApplicationsResponseSchema = z.object({
  applications: ApplicationSchema.passthrough().array()
});

export const ApplicationResponseSchema = z.object({
  application: z.union([ApplicationSchema, ApplicationWithDetailsSchema])
});

export const ApplicationStatsResponseSchema = z.object({
  total: z.number(),
  pending: z.number(),
  accepted: z.number(),
  rejected: z.number()
});

// Application status enum already defined above

// Type exports
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type ApplicationWithDetailsInput = z.infer<typeof ApplicationWithDetailsSchema>;
export type ApplicationsResponseInput = z.infer<typeof ApplicationsResponseSchema>;
export type ApplicationResponseInput = z.infer<typeof ApplicationResponseSchema>;
export type ApplicationStatsResponseInput = z.infer<typeof ApplicationStatsResponseSchema>;
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;
export type ApplicationWithDetails = ApplicationWithDetailsInput;

// Validation helper functions
export const validateCreateApplication = (data: unknown) => {
  try {
    return {
      success: true,
      data: CreateApplicationSchema.parse(data),
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

export const validateUpdateApplication = (data: unknown) => {
  try {
    return {
      success: true,
      data: UpdateApplicationSchema.parse(data),
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
