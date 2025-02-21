import * as chokidar from 'chokidar';
import * as path from 'path';
import type { Logger } from '../core/logger';
import type { PluginOptions } from '../core/types';
import { debounce } from '../utils/debounce';

export interface FileWatcherApi {
  readonly start: () => void;
  readonly stop: () => void;
}

export function createFileWatcher(
  options: PluginOptions,
  logger: Logger,
  onChange: (props:any) => Promise<void>
): FileWatcherApi {
  let watcher: chokidar.FSWatcher | null = null;

  // Only watch necessary directories
  const watchDirs = [
    ...Object.values(options.routes).map(r => r.input.directory),
    ...Object.values(options.modules).map(m => m.input.directory)
  ].filter(Boolean); // Remove any undefined directories

  // Get the types file path if it exists
  const typesFile = options.export?.types
    ? path.join(options.rootDir || process.cwd(), options.export.types)
    : null;

  // Increase debounce time and add queue handling
  let isProcessing = false;
  const debouncedOnChange = debounce(async () => {
    if (isProcessing) return;

    try {
      isProcessing = true;
      await onChange([]);
    } finally {
      isProcessing = false;
    }
  }, options.watch?.debounceTime || 1000);

  function start(): void {
    if (watcher) {
      logger.warn('File watcher already running');
      return;
    }

    try {
      watcher = chokidar.watch(watchDirs, {
        ignoreInitial: true,
        ignorePermissionErrors: true,
        // Add performance optimizations
        awaitWriteFinish: {
          stabilityThreshold: options.watch?.stabilityThreshold || 300,
          pollInterval: 100
        },
        // Prevent excessive memory usage
        usePolling: false,
        // Ignore common temporary files and the types file
        ignored: [
          /(^|[\/\\])\../,  // dotfiles
          '**/*.tmp',
          '**/*.temp',
          '**/node_modules/**',
          // Ignore the types file to prevent endless renders
          typesFile ? path.relative(process.cwd(), typesFile) : null
        ].filter(Boolean) as any
      });

      watcher
        .on('add', (path: string) => {
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been added`);
          debouncedOnChange();
        })
        .on('change', (path: string) => {
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been changed`);
          debouncedOnChange();
        })
        .on('unlink', (path: string) => {
          // Skip if this is the types file
          if (typesFile && path === typesFile) return;
          logger.debug(`File ${path} has been removed`);
          debouncedOnChange();
        })
        .on('error', (error: any) => {
          logger.error('Watcher error:', error);
        });

      logger.info('File watcher started');
    } catch (error) {
      logger.error('Failed to start file watcher:', error);
      throw error;
    }
  }

  function stop(): void {
    if (watcher) {
      watcher.close();
      watcher = null;
      logger.info('File watcher stopped');
    }
  }

  return {
    start,
    stop
  };
}
