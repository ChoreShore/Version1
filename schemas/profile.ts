import { z } from 'zod';

// Photo upload validation schema
export const PhotoUploadSchema = z.object({
  photo: z.instanceof(File)
    .refine((file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, 'Invalid file type. Allowed types: JPG, PNG, WebP')
    .refine((file) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      return file.size <= maxSize;
    }, 'File size exceeds 5MB limit')
});

// Bio validation schema
export const BioSchema = z.object({
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .transform((val) => val.trim())
    .refine((val) => {
      // Sanitize: remove HTML tags and special characters
      return val === val.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
    }, 'Bio must be plain text without HTML tags')
    .optional()
    .nullable()
});

// Type exports
export type PhotoUploadInput = z.infer<typeof PhotoUploadSchema>;
export type BioInput = z.infer<typeof BioSchema>;

// Validation helper function
export const validatePhotoUpload = (data: unknown) => {
  try {
    return {
      success: true,
      data: PhotoUploadSchema.parse(data),
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

export const validateBio = (data: unknown) => {
  try {
    return {
      success: true,
      data: BioSchema.parse(data),
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

// Sanitization helper function
export const sanitizeBio = (bio: string): string => {
  // Remove common HTML tags (script, style, etc.)
  let sanitized = bio.replace(/<\/?(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*>/gi, '');
  // Remove remaining angle brackets
  sanitized = sanitized.replace(/[<>]/g, '');
  // Trim whitespace
  return sanitized.trim();
};
