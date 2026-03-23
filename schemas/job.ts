import { z, ZodError } from 'zod';

// Enums matching existing types
export const BudgetTypeSchema = z.enum(['fixed', 'hourly']);
export const JobStatusSchema = z.enum(['draft', 'open', 'closed', 'completed']);

// Job creation schema - matches your current CreateJobPayload
export const CreateJobSchema = z.object({
  title: z.string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must be less than 100 characters')
    .trim(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .trim(),
  
  category_id: z.string()
    .uuid('Invalid category ID format'),
  
  postcode: z.string()
    .min(4, 'Postcode must be at least 4 characters')
    .max(10, 'Postcode must be less than 10 characters')
    .trim(),
  
  budget_type: BudgetTypeSchema,
  
  budget_amount: z.number()
    .positive('Budget amount must be positive')
    .max(1000000, 'Budget amount too large'),
  
  deadline: z.string()
    .min(1, 'Deadline is required')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, { message: 'Invalid deadline format' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Deadline must be in the future'
    })
});

// Job update schema - all fields optional
export const UpdateJobSchema = CreateJobSchema.partial();

// Full job schema - includes database fields (lenient for API responses)
export const JobSchema = z.object({
  id: z.string(),
  employer_id: z.string(),
  title: z.string(),
  description: z.string(),
  category_id: z.string(),
  postcode: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  budget_type: z.union([z.literal('fixed'), z.literal('hourly')]),
  budget_amount: z.number(),
  deadline: z.string(),
  status: z.union([z.literal('draft'), z.literal('open'), z.literal('closed'), z.literal('completed')]),
  created_at: z.string(),
  updated_at: z.string()
});

// Additional schemas for API responses and queries (lenient for database responses)
export const JobCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string()
});

export const JobPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  description_preview: z.string(),
  category_id: z.string(),
  category_name: z.string(),
  postcode_area: z.string(),
  budget_type: z.union([z.literal('fixed'), z.literal('hourly')]),
  budget_display: z.string(),
  created_at: z.string(),
  cta: z.string()
});

export const JobWithDetailsSchema = JobSchema.extend({
  employer_first_name: z.string().optional(),
  employer_last_name: z.string().optional(),
  category_name: z.string().optional()
});

export const JobsQuerySchema = z.object({
  limit: z.string().optional(),
  category: z.string().uuid().optional(),
  postcode: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  distance: z.string().optional()
});

export const JobsResponseSchema = z.object({
  jobs: z.union([JobSchema.passthrough().array(), JobPreviewSchema.array()]),
  preview_mode: z.boolean()
});

export const JobResponseSchema = z.object({
  job: z.union([JobSchema.passthrough(), JobWithDetailsSchema.passthrough()])
});

export const CategoriesResponseSchema = z.object({
  categories: JobCategorySchema.array()
});

export const NearJobsResponseSchema = z.object({
  jobs: z.array(z.object({
    job_id: z.string().uuid(),
    title: z.string(),
    distance_km: z.number()
  }))
});

// Type exports - can be used alongside existing types initially
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type JobInput = z.infer<typeof JobSchema>;
export type JobCategoryInput = z.infer<typeof JobCategorySchema>;
export type JobPreviewInput = z.infer<typeof JobPreviewSchema>;
export type JobWithDetailsInput = z.infer<typeof JobWithDetailsSchema>;
export type JobsQueryInput = z.infer<typeof JobsQuerySchema>;
export type JobsResponseInput = z.infer<typeof JobsResponseSchema>;
export type JobResponseInput = z.infer<typeof JobResponseSchema>;
export type CategoriesResponseInput = z.infer<typeof CategoriesResponseSchema>;
export type NearJobsResponseInput = z.infer<typeof NearJobsResponseSchema>;

// Validation helper functions
export const validateCreateJob = (data: unknown) => {
  try {
    return {
      success: true,
      data: CreateJobSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof ZodError) {
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

export const validateUpdateJob = (data: unknown) => {
  try {
    return {
      success: true,
      data: UpdateJobSchema.parse(data),
      errors: null
    };
  } catch (error) {
    if (error instanceof ZodError) {
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
