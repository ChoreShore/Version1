import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let consoleSpy: Record<string, ReturnType<typeof vi.spyOn>>;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  async function loadLogger() {
    vi.resetModules();
    return await import('~/server/utils/logger');
  }

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('logs debug messages', async () => {
      const { logger } = await loadLogger();
      logger.debug('test debug');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('logs info messages', async () => {
      const { logger } = await loadLogger();
      logger.info('test info');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('logs warn messages', async () => {
      const { logger } = await loadLogger();
      logger.warn('test warn');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('logs error messages', async () => {
      const { logger } = await loadLogger();
      logger.error('test error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('formats message with context', async () => {
      const { logger } = await loadLogger();
      logger.info('my message', 'MyContext');
      expect(consoleSpy.info).toHaveBeenCalledWith('[MyContext] my message');
    });

    it('formats error with Error instance', async () => {
      const { logger } = await loadLogger();
      const err = new Error('boom');
      logger.error('failed', err);
      expect(consoleSpy.error).toHaveBeenCalledWith('failed: boom');
    });

    it('formats error with non-Error value', async () => {
      const { logger } = await loadLogger();
      logger.error('failed', 'string error');
      expect(consoleSpy.error).toHaveBeenCalledWith('failed: string error');
    });

    it('formats error with context and error', async () => {
      const { logger } = await loadLogger();
      const err = new Error('boom');
      logger.error('failed', err, 'MyContext');
      expect(consoleSpy.error).toHaveBeenCalledWith('[MyContext] failed: boom');
    });

    it('passes extra args to console methods', async () => {
      const { logger } = await loadLogger();
      logger.debug('msg', 'ctx', { extra: 1 });
      expect(consoleSpy.debug).toHaveBeenCalledWith('[ctx] msg', { extra: 1 });
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('does not log debug messages', async () => {
      const { logger } = await loadLogger();
      logger.debug('test debug');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('does not log info messages', async () => {
      const { logger } = await loadLogger();
      logger.info('test info');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('logs warn messages', async () => {
      const { logger } = await loadLogger();
      logger.warn('test warn');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('logs error messages', async () => {
      const { logger } = await loadLogger();
      logger.error('test error');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('logDetailedError', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('logs detailed error in development', async () => {
      const { logDetailedError } = await loadLogger();
      const err = new Error('boom');
      logDetailedError(err, 'MyContext');
      expect(consoleSpy.error).toHaveBeenCalledWith('[MyContext] Detailed error:', err);
    });

    it('logs without context prefix when context is empty', async () => {
      const { logDetailedError } = await loadLogger();
      const err = new Error('boom');
      logDetailedError(err);
      expect(consoleSpy.error).toHaveBeenCalledWith(' Detailed error:', err);
    });

    it('logs minimal info in production', async () => {
      process.env.NODE_ENV = 'production';
      const { logDetailedError } = await loadLogger();
      const err = new Error('boom');
      logDetailedError(err, 'MyContext');
      expect(consoleSpy.error).toHaveBeenCalledWith('[MyContext] Error occurred:', 'boom');
    });

    it('logs string representation for non-Error in production', async () => {
      process.env.NODE_ENV = 'production';
      const { logDetailedError } = await loadLogger();
      logDetailedError('some string error', 'Ctx');
      expect(consoleSpy.error).toHaveBeenCalledWith('[Ctx] Error occurred:', 'some string error');
    });
  });
});
