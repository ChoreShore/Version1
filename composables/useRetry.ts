import { ref } from 'vue';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  nextRetryIn: number | null;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2
  } = options;

  const retryState = ref<RetryState>({
    isRetrying: false,
    retryCount: 0,
    nextRetryIn: null
  });

  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  const calculateDelay = (attempt: number): number => {
    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay
    );
    return delay;
  };

  const executeWithRetry = async <T>(
    fn: () => Promise<T>,
    onError?: (error: Error, attempt: number) => void
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        retryState.value = {
          isRetrying: attempt > 0,
          retryCount: attempt,
          nextRetryIn: attempt > 0 && attempt < maxRetries ? calculateDelay(attempt) : null
        };

        const result = await fn();
        
        // Success - reset retry state
        retryState.value = {
          isRetrying: false,
          retryCount: 0,
          nextRetryIn: null
        };
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        if (onError) {
          onError(error, attempt);
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry
        const delay = calculateDelay(attempt);
        await new Promise(resolve => {
          retryTimeout = setTimeout(resolve, delay);
        });
      }
    }

    // All retries failed - reset state
    retryState.value = {
      isRetrying: false,
      retryCount: 0,
      nextRetryIn: null
    };

    throw lastError;
  };

  const resetRetry = () => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    retryState.value = {
      isRetrying: false,
      retryCount: 0,
      nextRetryIn: null
    };
  };

  return {
    retryState,
    executeWithRetry,
    resetRetry
  };
}
