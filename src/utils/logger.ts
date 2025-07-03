import { LogLevel } from "../types/plugin";
import type { Logger as ViteLogger } from "vite";

export interface Logger {
  readonly debug: (message: string, ...args: unknown[]) => void;
  readonly info: (message: string, ...args: unknown[]) => void;
  readonly warn: (message: string, ...args: unknown[]) => void;
  readonly error: (message: string, error?: Error | unknown) => void;
}

/**
 * Creates a logger instance that wraps Vite's logger, filtering messages based on a specified log level.
 *
 * @param viteLogger - The Vite logger instance.
 * @param logLevel - The minimum log level to display messages. Defaults to "info".
 * @returns A Logger instance.
 */
export function createLogger(
  viteLogger: ViteLogger,
  logLevel: LogLevel = "info",
): Logger {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const currentLevel = levels[logLevel];

  return {
    debug: (message, ...args) => {
      if (currentLevel <= levels.debug) {
        viteLogger.info(`[vite-autoload] DEBUG: ${message} ${args.join(" ")}`);
      }
    },
    info: (message, ...args) => {
      if (currentLevel <= levels.info) {
        viteLogger.info(`[vite-autoload] INFO: ${message} ${args.join(" ")}`);
      }
    },
    warn: (message, ...args) => {
      if (currentLevel <= levels.warn) {
        viteLogger.warn(`[vite-autoload] WARN: ${message} ${args.join(" ")}`);
      }
    },
    error: (message, error) => {
      if (currentLevel <= levels.error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        viteLogger.error(`[vite-autoload] ERROR: ${message} ${errorMessage}`);
      }
    },
  };
}
