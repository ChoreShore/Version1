import { z } from 'zod';
import { validateSchema } from './validation';

// Enums matching existing types
export const BudgetTypeSchema = z.enum(['fixed', 'hourly']);
export const JobStatusSchema = z.enum(['draft', 'open', 'closed', 'completed']);

// Job creation schema - matches your current CreateJobPayload
export const CreateJobSchema = z.object({
  title: z.string()
    .min(1, 'Please enter a job title')
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
    .positive('Please enter a positive budget amount')
    .max(10000, 'Budget amount too large'),
  
  deadline: z.string()
    .min(1, 'Please select a deadline')
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, { message: 'Please enter a valid deadline' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Deadline must be in the future'
    }),

  estimated_hours: z.number()
    .int('Estimated hours must be a whole number')
    .min(1, 'Estimated hours must be at least 1')
    .max(30, 'Estimated hours cannot exceed 30')
    .optional()
    .nullable(),

  is_recurring: z.boolean().optional().default(false),

  client_request_id: z.string().optional()
});

// Job update schema - all fields optional plus status
export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: JobStatusSchema.optional()
});

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
  estimated_hours: z.number().nullable().optional(),
  is_recurring: z.boolean().optional(),
  is_urgent: z.boolean().optional(),
  status: z.union([z.literal('draft'), z.literal('open'), z.literal('closed'), z.literal('completed')]),
  created_at: z.string(),
  updated_at: z.string()
});

// Additional schemas for API responses and queries (lenient for database responses)
export const JobCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
  is_active: z.boolean().optional().nullable()
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
    postcode_area: z.string(),
    distance_km: z.number()
  }))
});

// Public landing page preview — minimal, safe data for unauthenticated visitors
export const PublicJobPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category_id: z.string(),
  category_name: z.string(),
  postcode_area: z.string(),
  budget_type: z.union([z.literal('fixed'), z.literal('hourly')]),
  budget_amount: z.number(),
  created_at: z.string(),
  posted_at_relative: z.string(),
  employer: z.object({
    display_name: z.string(),
    average_rating: z.number().nullable(),
    total_jobs_posted: z.number()
  }),
  application_count: z.number(),
  tags: z.string().array()
});

export const PublicJobsResponseSchema = z.object({
  jobs: PublicJobPreviewSchema.array()
});

// Public jobs board — distance-sorted browseable listings
export const JobsBoardJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  budget_type: z.union([z.literal('fixed'), z.literal('hourly')]),
  budget_amount: z.number(),
  distance_miles: z.number(),
  posted_at_relative: z.string(),
  category_name: z.string(),
  postcode_area: z.string()
});

export const JobsBoardResponseSchema = z.object({
  jobs: JobsBoardJobSchema.array(),
  total: z.number()
});

// Type exports - can be used alongside existing types initially
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type JobInput = z.infer<typeof JobSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobCategoryInput = z.infer<typeof JobCategorySchema>;
export type JobPreviewInput = z.infer<typeof JobPreviewSchema>;
export type JobWithDetailsInput = z.infer<typeof JobWithDetailsSchema>;
export type JobsQueryInput = z.infer<typeof JobsQuerySchema>;
export type JobsResponseInput = z.infer<typeof JobsResponseSchema>;
export type JobResponseInput = z.infer<typeof JobResponseSchema>;
export type CategoriesResponseInput = z.infer<typeof CategoriesResponseSchema>;
export type NearJobsResponseInput = z.infer<typeof NearJobsResponseSchema>;
export type PublicJobPreviewInput = z.infer<typeof PublicJobPreviewSchema>;
export type PublicJobsResponseInput = z.infer<typeof PublicJobsResponseSchema>;
export type JobsBoardJobInput = z.infer<typeof JobsBoardJobSchema>;
export type JobsBoardResponseInput = z.infer<typeof JobsBoardResponseSchema>;

// Validation helper functions
export const validateCreateJob = (data: unknown) => validateSchema(CreateJobSchema, data);
export const validateUpdateJob = (data: unknown) => validateSchema(UpdateJobSchema, data);
