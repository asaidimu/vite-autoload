import * as chokidar from "chokidar";
import * as path from "path";
import type { Logger } from "../utils/logger";
import type { PluginOptions } from "../types/plugin";
import type { FileMatchConfig } from "../types/transform";
import { debounce } from "../utils/debounce";

/**
 * Interface for the file watcher API.
 */
export interface FileWatcherApi {
  /** Starts the file watcher. */
  readonly start: () => void;
  /** Stops the file watcher. */
  readonly stop: () => void;
}

/**
 * Creates a file watcher instance that monitors changes in specified directories.
 *
 * @param options - The plugin options, including watch settings.
 * @param logger - The logger instance.
 * @param onChange - Callback function to be executed when files change.
 * @returns A FileWatcherApi instance.
 */
export function createFileWatcher(
  options: PluginOptions,
  logger: Logger,
  onChange: (changedFiles: string[]) => Promise<void>,
): FileWatcherApi {
  let watcher: chokidar.FSWatcher | null = null;

  logger.debug("Initializing file watcher...");

  // Only watch necessary directories
  const watchDirs = options.components
    .flatMap((component) =>
      component.groups
        .filter((group) => typeof group.input !== "function")
        .map((group) => (group.input as FileMatchConfig).directory),
    )
    .filter(Boolean); // Remove any undefined directories

  logger.debug(`Watching directories: ${watchDirs.join(", ")}`);

  // Get the types file path if it exists
  const typesFile = options.settings.export?.types
    ? path.join(
        options.settings.rootDir || process.cwd(),
        options.settings.export.types,
      )
    : null;

  if (typesFile) {
    logger.debug(`Ignoring types file: ${typesFile}`);
  }

  // Increase debounce time and add queue handling
  let isProcessing = false;
  const debouncedOnChange = debounce(async (changedFiles: string[]) => {
    if (isProcessing) {
      logger.debug(
        "File watcher: debouncedOnChange skipped, already processing.",
      );
      return;
    }

    logger.debug("File watcher: debouncedOnChange triggered.");
    try {
      isProcessing = true;
      await onChange(changedFiles);
      logger.debug("File watcher: onChange callback executed.");
    } finally {
      isProcessing = false;
      logger.debug("File watcher: debouncedOnChange finished processing.");
    }
  }, options.settings.watch?.debounceTime || 1000);

  function start(): void {
    logger.debug("Attempting to start file watcher.");
    if (watcher) {
      logger.warn("File watcher already running");
      return;
    }

    try {
      watcher = chokidar.watch(watchDirs, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
        // Add performance optimizations
        awaitWriteFinish: {
          stabilityThreshold: options.settings.watch?.stabilityThreshold || 300,
          pollInterval: 100,
        },
        // Prevent excessive memory usage
        usePolling: false,
        // Ignore common temporary files and the types file
        ignored: [
          /(^|[\\/])\../, // dotfiles
          "**/*.tmp",
          "**/*.temp",
          "**/node_modules/**",
          // Ignore the types file to prevent endless renders
          typesFile ? path.relative(process.cwd(), typesFile) : null,
        ].filter(Boolean) as any,
      });

      watcher
        .on("add", (path: string) => {
          logger.debug(`File watcher: File added: ${path}`);
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been added`);
          debouncedOnChange([path]); // Pass the changed file
        })
        .on("change", (path: string) => {
          logger.debug(`File watcher: File changed: ${path}`);
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been changed`);
          debouncedOnChange([path]); // Pass the changed file
        })
        .on("unlink", (path: string) => {
          logger.debug(`File watcher: File removed: ${path}`);
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been removed`);
          debouncedOnChange([path]); // Pass the changed file
        })
        .on("error", (error: any) => {
          logger.error("Watcher error:", error);
        });

      logger.info("File watcher started");
    } catch (error) {
      logger.error("Failed to start file watcher:", error);
      throw error;
    }
  }

  function stop(): void {
    logger.debug("Attempting to stop file watcher.");
    if (watcher) {
      watcher.close();
      watcher = null;
      logger.info("File watcher stopped");
    } else {
      logger.debug("File watcher not running, no need to stop.");
    }
  }

  return {
    start,
    stop,
  };
}
