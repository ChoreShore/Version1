import { z, type ZodSchema } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data: T | null;
  errors: Record<string, string> | null;
}

export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    return { success: true, data: schema.parse(data), errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc, err) => {
          acc[err.path[0] as string] = err.message;
          return acc;
        }, {} as Record<string, string>)
      };
    }
    throw error;
  }
}
