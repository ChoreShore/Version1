import { createError, setHeader } from 'h3';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
}

// In-memory rate limit store (for production, use Redis)
const rateLimitStore = new Map<string, number[]>();

// Cleanup interval to prevent memory leaks
const CLEANUP_INTERVAL = 60000; // 1 minute
const MAX_STORE_SIZE = 10000; // Maximum number of entries to prevent memory issues

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  let totalEntries = 0;
  
  for (const [key, timestamps] of rateLimitStore.entries()) {
    // Filter out timestamps outside the current window (using the most recent window)
    if (timestamps.length > 0) {
      const mostRecent = timestamps[timestamps.length - 1];
      const windowStart = mostRecent - CLEANUP_INTERVAL;
      const filtered = timestamps.filter(t => t > windowStart);
      
      if (filtered.length === 0) {
        rateLimitStore.delete(key);
      } else if (filtered.length !== timestamps.length) {
        rateLimitStore.set(key, filtered);
      }
      totalEntries += filtered.length;
    } else {
      rateLimitStore.delete(key);
    }
  }
  
  // If store is too large, remove oldest entries
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(rateLimitStore.entries());
    // Sort by oldest timestamp and remove excess
    entries.sort((a, b) => {
      const aOldest = a[1][0] || Infinity;
      const bOldest = b[1][0] || Infinity;
      return aOldest - bOldest;
    });
    
    const toRemove = entries.slice(0, rateLimitStore.size - MAX_STORE_SIZE);
    for (const [key] of toRemove) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the user/IP (e.g., user ID or IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Get existing timestamps for this identifier
  const timestamps = rateLimitStore.get(identifier) || [];
  
  // Filter out timestamps outside the current window
  const recentTimestamps = timestamps.filter(t => t > windowStart);
  
  // Check if limit exceeded
  if (recentTimestamps.length >= config.maxRequests) {
    // Calculate reset time (oldest timestamp + window)
    const oldestTimestamp = recentTimestamps[0];
    const resetTime = new Date(oldestTimestamp + config.windowMs);
    
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime
    };
  }
  
  // Add current request timestamp
  recentTimestamps.push(now);
  rateLimitStore.set(identifier, recentTimestamps);
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - recentTimestamps.length,
    resetTime: new Date(now + config.windowMs)
  };
}

/**
 * Rate limiting middleware for API endpoints
 * @param config - Rate limit configuration
 * @returns Function that throws error if rate limited
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (identifier: string, event?: any) => {
    const result = checkRateLimit(identifier, config);
    
    if (!result.success) {
      if (event) {
        setHeader(event, 'Retry-After', Math.ceil((result.resetTime.getTime() - Date.now()) / 1000));
        setHeader(event, 'X-RateLimit-Limit', result.limit);
        setHeader(event, 'X-RateLimit-Remaining', result.remaining);
        setHeader(event, 'X-RateLimit-Reset', result.resetTime.toISOString());
      }
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Too many requests. Please try again later.',
        data: {
          limit: result.limit,
          remaining: result.remaining,
          resetTime: result.resetTime
        }
      });
    }
    
    return result;
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 requests per 15 minutes
  }),
  
  // Moderate rate limiting for job creation
  jobCreation: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 jobs per hour
  }),
  
  // Lenient rate limiting for applications
  applications: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30 // 30 applications per hour
  }),
  
  // Strict rate limiting for password operations
  password: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3 // 3 password changes per hour
  }),
  
  // General API rate limiting
  general: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  })
};
