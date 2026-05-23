import { z } from 'zod';

export const IdentityRecordSchema = z.object({
  status: z.enum(['verified', 'in_review', 'declined']),
  sessionId: z.string().min(1, 'Please enter a session ID'),
  verifiedAt: z.string().datetime().optional()
});

export type IdentityRecordInput = z.infer<typeof IdentityRecordSchema>;

export const validateIdentityRecord = (data: unknown) => {
  try {
    return {
      success: true,
      data: IdentityRecordSchema.parse(data),
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
