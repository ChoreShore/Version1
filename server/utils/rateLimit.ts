import { createError, setHeader } from 'h3';
import Redis from 'ioredis';

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

// Redis client for distributed rate limiting
let redisClient: Redis | null = null;
let useInMemoryFallback = false;

// Fallback in-memory store for development/testing when Redis is unavailable
const rateLimitStore = new Map<string, number[]>();

// Initialize Redis client
function initializeRedis() {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

  if (redisUrl) {
    try {
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.error('Redis connection failed after retries, rate limiting will fail closed');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      redisClient.on('error', (err) => {
        console.error('Redis error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis connected for rate limiting');
      });
    } catch (error) {
      console.error('Failed to initialize Redis, rate limiting will fail closed:', error);
    }
  } else {
    // Only allow in-memory fallback in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.warn('REDIS_URL not configured, using in-memory rate limiting (development mode only)');
      useInMemoryFallback = true;
    } else {
      console.error('REDIS_URL not configured in production, rate limiting will fail closed');
    }
  }
}

// Initialize Redis on module load
initializeRedis();

// Cleanup interval for in-memory fallback (only used when Redis is unavailable)
const CLEANUP_INTERVAL = 60000; // 1 minute
const MAX_STORE_SIZE = 10000; // Maximum number of entries to prevent memory issues

// Periodic cleanup of expired entries (in-memory fallback only)
setInterval(() => {
  if (!useInMemoryFallback) return; // Skip cleanup when using Redis
  
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
 * Check if a request should be rate limited using Redis (distributed) or in-memory fallback
 * @param identifier - Unique identifier for the user/IP (e.g., user ID or IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const redisKey = `ratelimit:${identifier}`;

  // Fail closed in production if Redis is not available
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!redisClient && !useInMemoryFallback && !isDevelopment) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service temporarily unavailable. Please try again later.'
    });
  }

  // Use Redis for distributed rate limiting if available
  if (redisClient && !useInMemoryFallback) {
    try {
      const pipeline = redisClient.pipeline();

      // Remove entries outside the current window
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Count current requests in window
      pipeline.zcard(redisKey);

      // Add current request
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiration to windowMs + 1 second buffer
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000) + 1);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline execution failed');
      }

      const count = results[1][1] as number;

      // Check if limit exceeded (count before adding current request)
      if (count >= config.maxRequests) {
        // Get oldest timestamp to calculate reset time
        const oldest = await redisClient.zrange(redisKey, 0, 0, 'WITHSCORES');
        const oldestTimestamp = oldest.length > 1 ? parseFloat(oldest[1]) : now;
        const resetTime = new Date(oldestTimestamp + config.windowMs);

        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime
        };
      }

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - count - 1,
        resetTime: new Date(now + config.windowMs)
      };
    } catch (error) {
      console.error('Redis rate limiting error:', error);
      // Fail closed in production, allow fallback in development
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        throw createError({
          statusCode: 503,
          statusMessage: 'Service temporarily unavailable. Please try again later.'
        });
      }
      console.warn('Falling back to in-memory rate limiting (development mode)');
      useInMemoryFallback = true;
      // Fall through to in-memory implementation
    }
  }
  
  // In-memory fallback (original implementation)
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
 * @returns Async function that throws error if rate limited
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (identifier: string, event?: any) => {
    const result = await checkRateLimit(identifier, config);
    
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
  }),

  // Username availability checks — prevents mass enumeration
  usernameCheck: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 username checks per minute per IP
  }),

  // Message rate limiting — prevents spam
  messages: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 messages per minute per user
  })
};
