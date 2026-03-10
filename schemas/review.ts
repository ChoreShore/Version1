import { z } from 'zod';

// Review creation schema (strict for input validation)
export const CreateReviewSchema = z.object({
  job_id: z.string().uuid('Invalid job ID format'),
  reviewed_user_id: z.string().uuid('Invalid reviewed user ID format'),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .int('Rating must be a whole number'),
  comment: z.string()
    .min(10, 'Review comment must be at least 10 characters')
    .max(1000, 'Review comment must be less than 1000 characters')
    .trim()
    .optional()
});

// Full review schema (lenient for database responses)
export const ReviewSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  reviewer_id: z.string(),
  reviewed_user_id: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  // Additional fields for compatibility
  review_id: z.string().optional(),
  job_title: z.string().optional(),
  reviewer_first_name: z.string().optional(),
  reviewer_last_name: z.string().optional(),
  reviewed_user_first_name: z.string().optional(),
  reviewed_user_last_name: z.string().optional()
});

// Review with details schema (lenient for database responses)
export const ReviewWithDetailsSchema = ReviewSchema.extend({
  reviewer_first_name: z.string().optional(),
  reviewer_last_name: z.string().optional(),
  reviewee_first_name: z.string().optional(),
  reviewee_last_name: z.string().optional(),
  job_title: z.string().optional()
});

// API response schemas (lenient for database responses)
export const ReviewsResponseSchema = z.object({
  reviews: ReviewSchema.array()
});

export const ReviewResponseSchema = z.object({
  review: z.union([ReviewSchema, ReviewWithDetailsSchema])
});

// Type exports
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
export type ReviewWithDetailsInput = z.infer<typeof ReviewWithDetailsSchema>;
export type ReviewsResponseInput = z.infer<typeof ReviewsResponseSchema>;
export type ReviewResponseInput = z.infer<typeof ReviewResponseSchema>;

// Validation helper functions
export const validateCreateReview = (data: unknown) => {
  try {
    return {
      success: true,
      data: CreateReviewSchema.parse(data),
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
