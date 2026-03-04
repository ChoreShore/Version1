import { describe, it, expect } from 'vitest';
import { 
  validateBudget, 
  validateDeadline, 
  validatePostcode,
  validateCoordinates,
  validateJobTitle,
  validateJobDescription,
  validateBudgetType,
  validateCategoryId,
  validateCreateJobPayload,
  validateUpdateJobPayload
} from '~/server/utils/jobValidation';

describe('Job Validation', () => {
  describe('validateBudget', () => {
    it('should reject negative amounts', () => {
      expect(validateBudget(-1)).toEqual({ valid: false, message: 'Budget amount must be greater than 0' });
      expect(validateBudget(-100)).toEqual({ valid: false, message: 'Budget amount must be greater than 0' });
    });

    it('should reject zero', () => {
      expect(validateBudget(0)).toEqual({ valid: false, message: 'Budget amount must be greater than 0' });
    });

    it('should accept positive amounts', () => {
      expect(validateBudget(1)).toEqual({ valid: true });
      expect(validateBudget(100)).toEqual({ valid: true });
      expect(validateBudget(9999.99)).toEqual({ valid: true });
    });

    it('should reject too high amounts', () => {
      expect(validateBudget(10001)).toEqual({ valid: false, message: 'Budget amount seems too high' });
    });

    it('should reject invalid types', () => {
      expect(validateBudget(NaN)).toEqual({ valid: false, message: 'Budget amount must be a valid number' });
      expect(validateBudget(null as any)).toEqual({ valid: false, message: 'Budget amount must be a valid number' });
      expect(validateBudget('100' as any)).toEqual({ valid: false, message: 'Budget amount must be a valid number' });
    });
  });

  describe('validateDeadline', () => {
    it('should reject past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(validateDeadline(pastDate)).toEqual({ valid: false, message: 'Deadline must be in the future' });
    });

    it('should reject current date', () => {
      const now = new Date();
      expect(validateDeadline(now)).toEqual({ valid: false, message: 'Deadline must be in the future' });
    });

    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      expect(validateDeadline(futureDate)).toEqual({ valid: true });
      
      // Use a future date that's within the 5-year limit
      const farFuture = new Date('2026-12-31');
      expect(validateDeadline(farFuture)).toEqual({ valid: true });
    });

    it('should accept string dates', () => {
      expect(validateDeadline('2026-12-31')).toEqual({ valid: true });
      expect(validateDeadline('2026-12-31T23:59:59Z')).toEqual({ valid: true });
    });

    it('should reject dates too far in future', () => {
      const tooFar = new Date();
      tooFar.setFullYear(tooFar.getFullYear() + 6);
      expect(validateDeadline(tooFar)).toEqual({ valid: false, message: 'Deadline cannot be more than 5 years in the future' });
    });

    it('should reject invalid date formats', () => {
      expect(validateDeadline('invalid-date')).toEqual({ valid: false, message: 'Invalid deadline format' });
      expect(validateDeadline('')).toEqual({ valid: false, message: 'Invalid deadline format' });
    });
  });

  describe('validatePostcode', () => {
    it('should accept valid UK postcodes', () => {
      expect(validatePostcode('SW1A 1AA')).toEqual({ valid: true });
      expect(validatePostcode('SW1A1AA')).toEqual({ valid: true });
      expect(validatePostcode('EC1A 1BB')).toEqual({ valid: true });
      expect(validatePostcode('M1 1AE')).toEqual({ valid: true });
    });

    it('should reject invalid postcodes', () => {
      expect(validatePostcode('')).toEqual({ valid: false, message: 'Postcode is required' });
      expect(validatePostcode('123')).toEqual({ valid: false, message: 'Invalid UK postcode format' });
      expect(validatePostcode('INVALID')).toEqual({ valid: false, message: 'Invalid UK postcode format' });
    });

    it('should handle whitespace', () => {
      expect(validatePostcode(' SW1A 1AA ')).toEqual({ valid: true });
      expect(validatePostcode('  SW1A1AA')).toEqual({ valid: true });
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid UK coordinates', () => {
      expect(validateCoordinates(51.5074, -0.1278)).toEqual({ valid: true }); // London
      expect(validateCoordinates(53.4808, -2.2426)).toEqual({ valid: true }); // Manchester
      expect(validateCoordinates(55.9533, -3.1883)).toEqual({ valid: true }); // Edinburgh
    });

    it('should reject coordinates outside UK bounds', () => {
      expect(validateCoordinates(48.8566, 2.3522)).toEqual({ valid: false, message: 'Coordinates appear to be outside UK bounds' }); // Paris
      expect(validateCoordinates(40.7128, -74.0060)).toEqual({ valid: false, message: 'Coordinates appear to be outside UK bounds' }); // New York
    });

    it('should reject invalid coordinate ranges', () => {
      expect(validateCoordinates(91, 0)).toEqual({ valid: false, message: 'Latitude must be between -90 and 90' });
      expect(validateCoordinates(-91, 0)).toEqual({ valid: false, message: 'Latitude must be between -90 and 90' });
      expect(validateCoordinates(0, 181)).toEqual({ valid: false, message: 'Longitude must be between -180 and 180' });
      expect(validateCoordinates(0, -181)).toEqual({ valid: false, message: 'Longitude must be between -180 and 180' });
    });

    it('should reject invalid types', () => {
      expect(validateCoordinates(NaN, 0)).toEqual({ valid: false, message: 'Coordinates must be valid numbers' });
      expect(validateCoordinates(0, NaN)).toEqual({ valid: false, message: 'Coordinates must be valid numbers' });
    });
  });

  describe('validateJobTitle', () => {
    it('should accept valid titles', () => {
      expect(validateJobTitle('Clean my house')).toEqual({ valid: true });
      expect(validateJobTitle('Need help with gardening')).toEqual({ valid: true });
      expect(validateJobTitle('A'.repeat(200))).toEqual({ valid: true });
    });

    it('should reject short titles', () => {
      expect(validateJobTitle('Hi')).toEqual({ valid: false, message: 'Job title must be at least 3 characters long' });
      expect(validateJobTitle('AB')).toEqual({ valid: false, message: 'Job title must be at least 3 characters long' });
    });

    it('should reject long titles', () => {
      expect(validateJobTitle('A'.repeat(201))).toEqual({ valid: false, message: 'Job title cannot exceed 200 characters' });
    });

    it('should reject empty or invalid titles', () => {
      expect(validateJobTitle('')).toEqual({ valid: false, message: 'Job title is required' });
      expect(validateJobTitle('   ')).toEqual({ valid: false, message: 'Job title cannot be empty' });
    });
  });

  describe('validateJobDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateJobDescription('Need someone to clean my 3-bedroom house in London.')).toEqual({ valid: true });
      expect(validateJobDescription('A'.repeat(2000))).toEqual({ valid: true });
    });

    it('should reject short descriptions', () => {
      expect(validateJobDescription('Too short')).toEqual({ valid: false, message: 'Job description must be at least 10 characters long' });
      expect(validateJobDescription('123456789')).toEqual({ valid: false, message: 'Job description must be at least 10 characters long' });
    });

    it('should reject long descriptions', () => {
      expect(validateJobDescription('A'.repeat(2001))).toEqual({ valid: false, message: 'Job description cannot exceed 2000 characters' });
    });

    it('should reject empty descriptions', () => {
      expect(validateJobDescription('')).toEqual({ valid: false, message: 'Job description is required' });
      expect(validateJobDescription('   ')).toEqual({ valid: false, message: 'Job description cannot be empty' });
    });
  });

  describe('validateBudgetType', () => {
    it('should accept valid budget types', () => {
      expect(validateBudgetType('fixed')).toEqual({ valid: true });
      expect(validateBudgetType('hourly')).toEqual({ valid: true });
    });

    it('should reject invalid budget types', () => {
      expect(validateBudgetType('')).toEqual({ valid: false, message: 'Budget type is required' });
      expect(validateBudgetType('daily')).toEqual({ valid: false, message: 'Budget type must be either "fixed" or "hourly"' });
      expect(validateBudgetType('FIXED')).toEqual({ valid: false, message: 'Budget type must be either "fixed" or "hourly"' });
    });
  });

  describe('validateCategoryId', () => {
    it('should accept valid UUID format', () => {
      expect(validateCategoryId('123e4567-e89b-12d3-a456-426614174000')).toEqual({ valid: true });
      expect(validateCategoryId('550e8400-e29b-41d4-a716-446655440000')).toEqual({ valid: true });
    });

    it('should reject invalid UUID formats', () => {
      expect(validateCategoryId('')).toEqual({ valid: false, message: 'Category ID is required' });
      expect(validateCategoryId('invalid-uuid')).toEqual({ valid: false, message: 'Invalid category ID format' });
      expect(validateCategoryId('123')).toEqual({ valid: false, message: 'Invalid category ID format' });
      expect(validateCategoryId('00000000-0000-0000-0000-000000000000')).toEqual({ valid: false, message: 'Invalid category ID format' });
    });
  });

  describe('validateCreateJobPayload', () => {
    it('should validate complete valid payload', () => {
      const validPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        latitude: 51.5074,
        longitude: -0.1278,
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      const result = validateCreateJobPayload(validPayload);
      expect(result).toEqual({ valid: true });
    });

    it('should reject payload with missing required fields', () => {
      const invalidPayload = {
        title: 'Clean my house',
        // Missing description, category_id, postcode, budget_type, budget_amount, deadline
      };

      const result = validateCreateJobPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.field).toBe('description');
    });

    it('should reject payload with invalid budget amount', () => {
      const invalidPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: -50,
        deadline: '2026-12-31T23:59:59Z'
      };

      const result = validateCreateJobPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.field).toBe('budget_amount');
    });

    it('should reject payload with invalid postcode', () => {
      const invalidPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'INVALID',
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      const result = validateCreateJobPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.field).toBe('postcode');
    });

    it('should accept payload without coordinates', () => {
      const validPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
        // No latitude/longitude
      };

      const result = validateCreateJobPayload(validPayload);
      expect(result).toEqual({ valid: true });
    });

    it('should reject payload with partial coordinates', () => {
      const invalidPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        latitude: 51.5074,
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      const result = validateCreateJobPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.field).toBe('coordinates');
    });
  });

  describe('validateUpdateJobPayload', () => {
    it('should validate partial update payload', () => {
      const validPayload = {
        title: 'Updated job title',
        budget_amount: 200
      };

      const result = validateUpdateJobPayload(validPayload);
      expect(result).toEqual({ valid: true });
    });

    it('should reject update payload with invalid status', () => {
      const invalidPayload = {
        status: 'invalid_status'
      };

      const result = validateUpdateJobPayload(invalidPayload);
      expect(result.valid).toBe(false);
      expect(result.field).toBe('status');
    });

    it('should accept empty payload (no changes)', () => {
      const result = validateUpdateJobPayload({});
      expect(result).toEqual({ valid: true });
    });
  });

  describe('comprehensive validation', () => {
    it('should validate complete job payload with individual functions', () => {
      const validPayload = {
        title: 'Clean my house',
        description: 'Need someone to clean my 3-bedroom house in London',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        postcode: 'SW1A 1AA',
        latitude: 51.5074,
        longitude: -0.1278,
        budget_type: 'fixed',
        budget_amount: 150,
        deadline: '2026-12-31T23:59:59Z'
      };

      expect(validateBudget(validPayload.budget_amount)).toEqual({ valid: true });
      expect(validateDeadline(validPayload.deadline)).toEqual({ valid: true });
      expect(validatePostcode(validPayload.postcode)).toEqual({ valid: true });
      expect(validateCoordinates(validPayload.latitude, validPayload.longitude)).toEqual({ valid: true });
      expect(validateJobTitle(validPayload.title)).toEqual({ valid: true });
      expect(validateJobDescription(validPayload.description)).toEqual({ valid: true });
      expect(validateBudgetType(validPayload.budget_type)).toEqual({ valid: true });
      expect(validateCategoryId(validPayload.category_id)).toEqual({ valid: true });
    });
  });
});