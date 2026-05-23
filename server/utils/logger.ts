/**
 * Centralized logging utility with environment-aware log levels
 * In production, only errors and warnings are logged
 * In development, all log levels are enabled
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const isDevelopment = process.env.NODE_ENV === 'development';
const currentLevel = isDevelopment ? 0 : 2; // debug in dev, warn in prod

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

function formatMessage(message: string, context?: string): string {
  return context ? `[${context}] ${message}` : message;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const logger = {
  debug: (message: string, context?: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage(message, context), ...args);
    }
  },

  info: (message: string, context?: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.info(formatMessage(message, context), ...args);
    }
  },

  warn: (message: string, context?: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage(message, context), ...args);
    }
  },

  error: (message: string, error?: unknown, context?: string, ...args: any[]) => {
    if (shouldLog('error')) {
      const formattedMessage = error 
        ? `${formatMessage(message, context)}: ${formatError(error)}`
        : formatMessage(message, context);
      console.error(formattedMessage, ...args);
    }
  }
};

/**
 * Log detailed error information server-side
 * In development, logs full error details
 * In production, logs minimal error info (could be sent to error monitoring service)
 */
export function logDetailedError(error: unknown, context: string = '') {
  const contextPrefix = context ? `[${context}]` : '';
  
  if (isDevelopment) {
    console.error(`${contextPrefix} Detailed error:`, error);
  } else {
    // In production, log minimal info - consider sending to Sentry/DataDog
    console.error(`${contextPrefix} Error occurred:`, error instanceof Error ? error.message : String(error));
  }
}
