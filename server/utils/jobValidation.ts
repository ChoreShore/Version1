export function validateBudget(amount: number): { valid: boolean; message?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: 'Budget amount must be a valid number' };
  }
  
  if (amount <= 0) {
    return { valid: false, message: 'Budget amount must be greater than 0' };
  }
  
  // Check for reasonable maximum (e.g., £10,000)
  if (amount > 10000) {
    return { valid: false, message: 'Budget amount seems too high' };
  }
  
  return { valid: true };
}

export function validateDeadline(deadline: Date | string): { valid: boolean; message?: string } {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  
  if (isNaN(deadlineDate.getTime())) {
    return { valid: false, message: 'Invalid deadline format' };
  }
  
  const now = new Date();
  // Remove buffer - current time should be rejected
  if (deadlineDate <= now) {
    return { valid: false, message: 'Deadline must be in the future' };
  }
  
  // Check if deadline is too far in future (e.g., more than 5 years)
  const maxFuture = new Date();
  maxFuture.setFullYear(maxFuture.getFullYear() + 5);
  if (deadlineDate > maxFuture) {
    return { valid: false, message: 'Deadline cannot be more than 5 years in the future' };
  }
  
  return { valid: true };
}

export function validatePostcode(postcode: string): { valid: boolean; message?: string } {
  if (!postcode || typeof postcode !== 'string') {
    return { valid: false, message: 'Postcode is required' };
  }
  
  const trimmedPostcode = postcode.trim();
  if (!trimmedPostcode) {
    return { valid: false, message: 'Postcode cannot be empty' };
  }
  
  // Basic UK postcode validation
  const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  if (!ukPostcodeRegex.test(trimmedPostcode)) {
    return { valid: false, message: 'Invalid UK postcode format' };
  }
  
  return { valid: true };
}

export function validateCoordinates(lat: number, lng: number): { valid: boolean; message?: string } {
  // UK bounds (roughly)
  const UK_BOUNDS = {
    minLat: 49.9,
    maxLat: 60.9,
    minLng: -8.0,
    maxLng: 1.8
  };
  
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return { valid: false, message: 'Coordinates must be valid numbers' };
  }
  
  if (lat < -90 || lat > 90) {
    return { valid: false, message: 'Latitude must be between -90 and 90' };
  }
  
  if (lng < -180 || lng > 180) {
    return { valid: false, message: 'Longitude must be between -180 and 180' };
  }
  
  // Optional: Check if coordinates are within UK bounds
  if (lat < UK_BOUNDS.minLat || lat > UK_BOUNDS.maxLat || 
      lng < UK_BOUNDS.minLng || lng > UK_BOUNDS.maxLng) {
    return { valid: false, message: 'Coordinates appear to be outside UK bounds' };
  }
  
  return { valid: true };
}

export function validateJobTitle(title: string): { valid: boolean; message?: string } {
  if (!title || typeof title !== 'string') {
    return { valid: false, message: 'Job title is required' };
  }
  
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { valid: false, message: 'Job title cannot be empty' };
  }
  
  if (trimmedTitle.length < 3) {
    return { valid: false, message: 'Job title must be at least 3 characters long' };
  }
  
  if (trimmedTitle.length > 200) {
    return { valid: false, message: 'Job title cannot exceed 200 characters' };
  }
  
  return { valid: true };
}

export function validateJobDescription(description: string): { valid: boolean; message?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, message: 'Job description is required' };
  }
  
  const trimmedDescription = description.trim();
  if (!trimmedDescription) {
    return { valid: false, message: 'Job description cannot be empty' };
  }
  
  if (trimmedDescription.length < 10) {
    return { valid: false, message: 'Job description must be at least 10 characters long' };
  }
  
  if (trimmedDescription.length > 2000) {
    return { valid: false, message: 'Job description cannot exceed 2000 characters' };
  }
  
  return { valid: true };
}

export function validateBudgetType(type: string): { valid: boolean; message?: string } {
  if (!type || typeof type !== 'string') {
    return { valid: false, message: 'Budget type is required' };
  }
  
  const validTypes = ['fixed', 'hourly'];
  if (!validTypes.includes(type)) {
    return { valid: false, message: 'Budget type must be either "fixed" or "hourly"' };
  }
  
  return { valid: true };
}

export function validateCategoryId(categoryId: string): { valid: boolean; message?: string } {
  if (!categoryId || typeof categoryId !== 'string') {
    return { valid: false, message: 'Category ID is required' };
  }
  
  // More permissive UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(categoryId)) {
    return { valid: false, message: 'Invalid category ID format' };
  }
  
  return { valid: true };
}

export function validateCreateJobPayload(payload: any): { valid: boolean; message?: string; field?: string } {
  // Check if payload exists
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Job data is required', field: 'payload' };
  }

  // Validate required fields
  const titleResult = validateJobTitle(payload.title);
  if (!titleResult.valid) return { ...titleResult, field: 'title' };
  
  const descriptionResult = validateJobDescription(payload.description);
  if (!descriptionResult.valid) return { ...descriptionResult, field: 'description' };
  
  const categoryResult = validateCategoryId(payload.category_id);
  if (!categoryResult.valid) return { ...categoryResult, field: 'category_id' };
  
  const postcodeResult = validatePostcode(payload.postcode);
  if (!postcodeResult.valid) return { ...postcodeResult, field: 'postcode' };
  
  const budgetTypeResult = validateBudgetType(payload.budget_type);
  if (!budgetTypeResult.valid) return { ...budgetTypeResult, field: 'budget_type' };
  
  const budgetResult = validateBudget(payload.budget_amount);
  if (!budgetResult.valid) return { ...budgetResult, field: 'budget_amount' };
  
  const deadlineResult = validateDeadline(payload.deadline);
  if (!deadlineResult.valid) return { ...deadlineResult, field: 'deadline' };
  
  // Validate optional coordinates
  if (payload.latitude !== undefined || payload.longitude !== undefined) {
    if (payload.latitude === undefined || payload.longitude === undefined) {
      return { valid: false, message: 'Both latitude and longitude must be provided together', field: 'coordinates' };
    }
    
    const coordResult = validateCoordinates(payload.latitude, payload.longitude);
    if (!coordResult.valid) return { ...coordResult, field: 'coordinates' };
  }
  
  return { valid: true };
}

export function validateUpdateJobPayload(payload: any): { valid: boolean; message?: string; field?: string } {
  // Check if payload exists
  if (!payload || typeof payload !== 'object') {
    return { valid: false, message: 'Update data is required', field: 'payload' };
  }

  // Validate optional fields if provided
  
  if (payload.title !== undefined) {
    const result = validateJobTitle(payload.title);
    if (!result.valid) return { ...result, field: 'title' };
  }
  
  if (payload.description !== undefined) {
    const result = validateJobDescription(payload.description);
    if (!result.valid) return { ...result, field: 'description' };
  }
  
  if (payload.category_id !== undefined) {
    const result = validateCategoryId(payload.category_id);
    if (!result.valid) return { ...result, field: 'category_id' };
  }
  
  if (payload.postcode !== undefined) {
    const result = validatePostcode(payload.postcode);
    if (!result.valid) return { ...result, field: 'postcode' };
  }
  
  if (payload.budget_type !== undefined) {
    const result = validateBudgetType(payload.budget_type);
    if (!result.valid) return { ...result, field: 'budget_type' };
  }
  
  if (payload.budget_amount !== undefined) {
    const result = validateBudget(payload.budget_amount);
    if (!result.valid) return { ...result, field: 'budget_amount' };
  }
  
  if (payload.deadline !== undefined) {
    const result = validateDeadline(payload.deadline);
    if (!result.valid) return { ...result, field: 'deadline' };
  }
  
  if (payload.status !== undefined) {
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(payload.status)) {
      return { valid: false, message: 'Invalid status. Must be one of: open, in_progress, completed, cancelled', field: 'status' };
    }
  }
  
  // Validate optional coordinates
  if (payload.latitude !== undefined || payload.longitude !== undefined) {
    if (payload.latitude === undefined || payload.longitude === undefined) {
      return { valid: false, message: 'Both latitude and longitude must be provided together', field: 'coordinates' };
    }
    
    const result = validateCoordinates(payload.latitude, payload.longitude);
    if (!result.valid) return { ...result, field: 'coordinates' };
  }
  
  return { valid: true };
}