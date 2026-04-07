import type { z } from 'zod';
import type {
  JobSchema,
  JobPreviewSchema,
  JobWithDetailsSchema,
  CreateJobSchema,
  UpdateJobSchema,
  BudgetTypeSchema,
  JobStatusSchema,
  JobCategorySchema
} from '../schemas/job';

export type Job = z.infer<typeof JobSchema>;
export type JobPreview = z.infer<typeof JobPreviewSchema>;
export type JobWithDetails = z.infer<typeof JobWithDetailsSchema>;
export type CreateJobPayload = z.infer<typeof CreateJobSchema>;
export type UpdateJobPayload = z.infer<typeof UpdateJobSchema>;
export type BudgetType = z.infer<typeof BudgetTypeSchema>;
export type JobStatus = z.infer<typeof JobStatusSchema>;
export type JobCategory = z.infer<typeof JobCategorySchema>;
