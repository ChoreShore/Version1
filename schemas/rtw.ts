import { z } from 'zod';

export const RtwVerifySchema = z.object({
  code: z
    .string()
    .min(1, 'Share code is required')
    .toUpperCase()
    .refine((val) => val.startsWith('W'), {
      message: "Right to work share codes start with 'W'"
    }),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be in dd-mm-yyyy format'),
  forename: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  surname: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim()
});

export const RtwApiResponseSchema = z.object({
  code: z.number(),
  status: z.object({
    outcome: z.enum([
      'ACCEPTED',
      'REJECTED',
      'NOT_FOUND',
      'SHARE_CODE_LOCKED',
      'SHARE_CODE_EXPIRED'
    ]),
    name: z.string().optional(),
    expiry_date: z.string().optional(),
    start_date: z.string().optional(),
    details: z.string().optional(),
    conditions: z.string().optional(),
    rejected_reason: z.string().nullable().optional()
  })
});

export type RtwVerifyInput = z.infer<typeof RtwVerifySchema>;
export type RtwApiResponse = z.infer<typeof RtwApiResponseSchema>;

export const validateRtwVerify = (data: unknown) => {
  try {
    return {
      success: true,
      data: RtwVerifySchema.parse(data),
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
