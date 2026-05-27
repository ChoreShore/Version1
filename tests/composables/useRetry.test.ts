import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRetry } from '~/composables/useRetry';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useRetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns successful result on first attempt', async () => {
    const { executeWithRetry, retryState } = useRetry();
    const fn = vi.fn().mockResolvedValue('success');

    const result = await executeWithRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(retryState.value.isRetrying).toBe(false);
    expect(retryState.value.retryCount).toBe(0);
    expect(retryState.value.nextRetryIn).toBeNull();
  });

  it('retries on failure and eventually succeeds', async () => {
    const { executeWithRetry, retryState } = useRetry({ maxRetries: 2, initialDelay: 20 });
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const promise = executeWithRetry(fn);
    await wait(25);
    await wait(45);
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(retryState.value.isRetrying).toBe(false);
    expect(retryState.value.retryCount).toBe(0);
  });

  it('uses exponential backoff between retries', async () => {
    const { executeWithRetry, retryState } = useRetry({ maxRetries: 3, initialDelay: 10, backoffMultiplier: 2 });
    const fn = vi.fn().mockImplementation(() => Promise.reject(new Error('always fails')));

    let caughtError: any = null;
    executeWithRetry(fn).catch((e) => { caughtError = e; });
    await wait(15);
    expect(retryState.value.nextRetryIn).toBe(20);
    await wait(25);
    expect(retryState.value.nextRetryIn).toBe(40);
    await wait(45);

    expect(caughtError).not.toBeNull();
    expect(caughtError.message).toBe('always fails');
    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('caps delay at maxDelay', async () => {
    const { executeWithRetry } = useRetry({ maxRetries: 2, initialDelay: 50, maxDelay: 80, backoffMultiplier: 2 });
    const fn = vi.fn().mockImplementation(() => Promise.reject(new Error('fail')));

    let caughtError: any = null;
    executeWithRetry(fn).catch((e) => { caughtError = e; });
    await wait(60);
    await wait(90);

    expect(caughtError).not.toBeNull();
    expect(caughtError.message).toBe('fail');
  });

  it('calls onError callback on each failed attempt', async () => {
    const onError = vi.fn();
    const { executeWithRetry } = useRetry({ maxRetries: 1, initialDelay: 10 });
    const fn = vi.fn().mockImplementation(() => Promise.reject(new Error('fail')));

    let caughtError: any = null;
    executeWithRetry(fn, onError).catch((e) => { caughtError = e; });
    await wait(15);

    expect(caughtError).not.toBeNull();
    expect(caughtError.message).toBe('fail');
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: 'fail' }), 0);
    expect(onError).toHaveBeenNthCalledWith(2, expect.objectContaining({ message: 'fail' }), 1);
  });

  it('resets retry state after success', async () => {
    const { executeWithRetry, retryState } = useRetry({ maxRetries: 2, initialDelay: 10 });
    const fn = vi.fn().mockResolvedValue('ok');

    await executeWithRetry(fn);

    expect(retryState.value.isRetrying).toBe(false);
    expect(retryState.value.retryCount).toBe(0);
    expect(retryState.value.nextRetryIn).toBeNull();
  });

  it('cleans up timeout on resetRetry', async () => {
    const { executeWithRetry, retryState, resetRetry } = useRetry({ maxRetries: 2, initialDelay: 20 });
    const fn = vi.fn().mockImplementation(() => Promise.reject(new Error('fail')));

    executeWithRetry(fn).catch(() => {});
    await wait(25);

    expect(retryState.value.isRetrying).toBe(true);

    resetRetry();

    expect(retryState.value.isRetrying).toBe(false);
    expect(retryState.value.retryCount).toBe(0);
    expect(retryState.value.nextRetryIn).toBeNull();
  });

  it('throws last error after all retries exhausted', async () => {
    const { executeWithRetry } = useRetry({ maxRetries: 1, initialDelay: 10 });
    const lastError = new Error('final failure');
    const fn = vi.fn()
      .mockImplementationOnce(() => Promise.reject(new Error('first failure')))
      .mockImplementationOnce(() => Promise.reject(lastError));

    let caughtError: any = null;
    executeWithRetry(fn).catch((e) => { caughtError = e; });
    await wait(15);

    expect(caughtError).not.toBeNull();
    expect(caughtError.message).toBe('final failure');
  });
});
