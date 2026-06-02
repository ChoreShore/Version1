import { z } from 'zod';

export const WorkerOnboardingSchema = z.object({
  role: z.enum(['employer', 'worker'], {
    message: 'Please select a role'
  }),
  postcode: z.string()
    .min(4, 'Postcode must be at least 4 characters')
    .max(10, 'Postcode must be less than 10 characters')
    .trim(),
  category_ids: z.array(z.string().uuid())
    .min(1, 'Select at least one category you want to work in'),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  skills: z.array(
    z.string()
      .min(1, 'Skill cannot be empty')
      .max(30, 'Skill must be less than 30 characters')
      .trim()
  )
    .max(10, 'You can add up to 10 skills')
    .optional(),
  photo_url: z.string().url().optional().nullable()
});

export type WorkerOnboardingInput = z.infer<typeof WorkerOnboardingSchema>;

export const validateWorkerOnboarding = (data: unknown) => {
  try {
    return {
      success: true,
      data: WorkerOnboardingSchema.parse(data),
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
