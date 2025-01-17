import type { LogLevel } from './types';

export interface Logger {
  readonly debug: (message: string, ...args: unknown[]) => void;
  readonly info: (message: string, ...args: unknown[]) => void;
  readonly warn: (message: string, ...args: unknown[]) => void;
  readonly error: (message: string, error?: Error | unknown) => void;
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  
  function shouldLog(messageLevel: LogLevel): boolean {
    return levels.indexOf(messageLevel) >= levels.indexOf(level);
  }

  function debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`[vite-autoload] ${message}`, ...args);
    }
  }

  function info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(`[vite-autoload] ${message}`, ...args);
    }
  }

  function warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[vite-autoload] ${message}`, ...args);
    }
  }

  function error(message: string, error?: Error | unknown): void {
    if (shouldLog('error')) {
      console.error(`[vite-autoload] ${message}`, error);
    }
  }

  return {
    debug,
    info,
    warn,
    error
  };
}
