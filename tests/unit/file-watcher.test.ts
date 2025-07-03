import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFileWatcher } from '../../src/watchers/file-watcher';
import type { Logger } from '../../src/utils/logger';
import { PluginOptions } from '../../src/types/plugin';
import * as chokidar from 'chokidar';
import * as debounceModule from '../../src/utils/debounce';
import path from 'path';

describe('createFileWatcher', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockOnChange = vi.fn();
  let mockDebounceFn: (cb: (...args: any[]) => any, delay: number) => (...args: any[]) => void;
  let mockWatcher: any;

  beforeEach(() => {
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn(),
    };
    vi.spyOn(chokidar, 'watch').mockReturnValue(mockWatcher);

    // Mock debounce to immediately call the function passed to it
    mockDebounceFn = (cb) => {
      const debounced = vi.fn(cb);
      debounced.mockImplementation((...args) => cb(...args));
      return debounced;
    };
    vi.spyOn(debounceModule, 'debounce').mockImplementation(mockDebounceFn as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start and stop the watcher', () => {
    const options: PluginOptions = {
      components: [],
      settings: {},
    };
    const watcherApi = createFileWatcher(options, mockLogger, mockOnChange);
    watcherApi.start();
    expect(chokidar.watch).toHaveBeenCalledWith([], {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
      usePolling: false,
      ignored: [/(^|[\\/])\../, '**/*.tmp', '**/*.temp', '**/node_modules/**'],
    });
    expect(mockLogger.info).toHaveBeenCalledWith('File watcher started');

    watcherApi.stop();
    expect(mockWatcher.close).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith('File watcher stopped');
  });

  it('should call onChange when a file is added', async () => {
    const options: PluginOptions = {
      components: [
        {
          name: 'test',
          strategy: {},
          groups: [
            {
              name: 'group1',
              input: { directory: '/test/dir', match: '**/*' },
            },
          ],
        },
      ],
      settings: {},
    };
    const watcherApi = createFileWatcher(options, mockLogger, mockOnChange);
    watcherApi.start();

    const addCallback = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'add')[1];
    await addCallback('/test/dir/file.ts');

    expect(mockOnChange).toHaveBeenCalledWith(['/test/dir/file.ts']);
  });

  it('should call onChange when a file is changed', async () => {
    const options: PluginOptions = {
      components: [
        {
          name: 'test',
          strategy: {},
          groups: [
            {
              name: 'group1',
              input: { directory: '/test/dir', match: '**/*' },
            },
          ],
        },
      ],
      settings: {},
    };
    const watcherApi = createFileWatcher(options, mockLogger, mockOnChange);
    watcherApi.start();

    const changeCallback = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'change')[1];
    await changeCallback('/test/dir/file.ts');

    expect(mockOnChange).toHaveBeenCalledWith(['/test/dir/file.ts']);
  });

  it('should call onChange when a file is unlinked', async () => {
    const options: PluginOptions = {
      components: [
        {
          name: 'test',
          strategy: {},
          groups: [
            {
              name: 'group1',
              input: { directory: '/test/dir', match: '**/*' },
            },
          ],
        },
      ],
      settings: {},
    };
    const watcherApi = createFileWatcher(options, mockLogger, mockOnChange);
    watcherApi.start();

    const unlinkCallback = mockWatcher.on.mock.calls.find((call: any) => call[0] === 'unlink')[1];
    await unlinkCallback('/test/dir/file.ts');

    expect(mockOnChange).toHaveBeenCalledWith(['/test/dir/file.ts']);
  });

  
});
