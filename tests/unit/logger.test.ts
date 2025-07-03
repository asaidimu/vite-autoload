import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from '../../src/utils/logger';

describe('createLogger', () => {
  let mockViteLogger: any;

  beforeEach(() => {
    mockViteLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(), // Vite's logger doesn't have a debug method by default, but we can mock it
    };
  });

  it('should log info messages when logLevel is info', () => {
    const logger = createLogger(mockViteLogger, 'info');
    logger.info('Test info message');
    expect(mockViteLogger.info).toHaveBeenCalledWith('[vite-autoload] INFO: Test info message ');
  });

  it('should not log debug messages when logLevel is info', () => {
    const logger = createLogger(mockViteLogger, 'info');
    logger.debug('Test debug message');
    expect(mockViteLogger.info).not.toHaveBeenCalled(); // Debug messages are routed to info in logger.ts
  });

  it('should log debug messages when logLevel is debug', () => {
    const logger = createLogger(mockViteLogger, 'debug');
    logger.debug('Test debug message');
    expect(mockViteLogger.info).toHaveBeenCalledWith('[vite-autoload] DEBUG: Test debug message ');
  });

  it('should log warn messages when logLevel is warn', () => {
    const logger = createLogger(mockViteLogger, 'warn');
    logger.warn('Test warn message');
    expect(mockViteLogger.warn).toHaveBeenCalledWith('[vite-autoload] WARN: Test warn message ');
  });

  it('should log error messages when logLevel is error', () => {
    const logger = createLogger(mockViteLogger, 'error');
    logger.error('Test error message', new Error('Some error'));
    expect(mockViteLogger.error).toHaveBeenCalledWith('[vite-autoload] ERROR: Test error message Some error');
  });

  it('should not log info messages when logLevel is warn', () => {
    const logger = createLogger(mockViteLogger, 'warn');
    logger.info('Test info message');
    expect(mockViteLogger.info).not.toHaveBeenCalled();
  });

  it('should not log info or warn messages when logLevel is error', () => {
    const logger = createLogger(mockViteLogger, 'error');
    logger.info('Test info message');
    logger.warn('Test warn message');
    expect(mockViteLogger.info).not.toHaveBeenCalled();
    expect(mockViteLogger.warn).not.toHaveBeenCalled();
  });
});
