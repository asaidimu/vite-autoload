import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runBuildStart, runCloseBundle, transformHtml } from '../../src/plugin/build';
import { PluginConfig, PluginRuntime } from '../../src/plugin/types';
import { ModuleGenerator } from '../../src/generators/generator';
import { ViteAdapter } from '../../src/plugin/vite-adapter';
import * as utils from '../../src/plugin/utils';
import type { Logger } from '../../src/utils/logger';

describe('build.ts', () => {
  const mockLogger: Logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };

  const mockPluginConfig: PluginConfig = {
    logger: mockLogger,
    options: {
      components: [],
      settings: {},
    },
    resolvedConfig: {
      isProduction: true,
      root: '/mock/root',
      base: '/',
      command: 'build',
      mode: 'production',
      is  : vi.fn(),
      build: {
        outDir: 'dist',
      },
    },
  };

  const mockPluginRuntime: PluginRuntime = {};

  const mockViteAdapter: ViteAdapter = {
    emitFile: vi.fn(),
  };

  const mockModuleGenerator: ModuleGenerator = {
    name: 'mockGenerator',
    config: [],
    modules: vi.fn().mockResolvedValue([]),
    data: vi.fn(),
    code: vi.fn(),
    match: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(utils, 'regenerateTypes').mockResolvedValue(undefined);
    vi.spyOn(utils, 'emitManifest').mockResolvedValue(undefined);
    vi.spyOn(utils, 'emitSitemap').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runBuildStart', () => {
    it('should skip tasks if not in production mode', async () => {
      const config = { ...mockPluginConfig, resolvedConfig: { ...mockPluginConfig.resolvedConfig, isProduction: false } };
      const runtime: PluginRuntime = {};
      await runBuildStart(mockViteAdapter, config, runtime, [mockModuleGenerator]);
      expect(mockLogger.debug).toHaveBeenCalledWith('Skipping build start tasks: not in production mode.');
      expect(utils.regenerateTypes).not.toHaveBeenCalled();
    });

    it('should regenerate types and emit chunks in production mode', async () => {
      mockModuleGenerator.modules.mockResolvedValue([
        { file: '/mock/file.tsx', uri: '/src/mock/file.tsx', path: 'file.tsx' },
      ]);
      const runtime: PluginRuntime = {};
      await runBuildStart(mockViteAdapter, mockPluginConfig, runtime, [mockModuleGenerator]);

      expect(mockLogger.info).toHaveBeenCalledWith('Running build start tasks...');
      expect(utils.regenerateTypes).toHaveBeenCalledWith(mockPluginConfig, [mockModuleGenerator]);
      expect(mockViteAdapter.emitFile).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chunk',
          id: '/mock/file.tsx',
          preserveSignature: 'exports-only',
        }),
      );
      expect(runtime.sourceToChunk).toBeInstanceOf(Map);
      expect(runtime.sourceToChunk!.size).toBe(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Build start tasks completed.');
    });
  });

  describe('runCloseBundle', () => {
    it('should emit manifest and sitemap', async () => {
      await runCloseBundle(mockViteAdapter, mockPluginConfig, mockPluginRuntime, [mockModuleGenerator]);

      expect(mockLogger.info).toHaveBeenCalledWith('Running close bundle tasks...');
      expect(utils.emitManifest).toHaveBeenCalledWith(mockPluginConfig);
      expect(utils.emitSitemap).toHaveBeenCalledWith(mockViteAdapter, mockPluginConfig, [mockModuleGenerator]);
      expect(mockLogger.info).toHaveBeenCalledWith('Close bundle tasks completed.');
    });
  });

  describe('transformHtml', () => {
    it('should inject manifest link if manifest setting is present', () => {
      const html = '<html><head></head><body></body></html>';
      const config = {
        ...mockPluginConfig,
        options: {
          ...mockPluginConfig.options,
          settings: {
            manifest: {
              output: 'my-manifest.webmanifest',
            },
          },
        },
      };
      const result = transformHtml(html, config);
      expect(result).toEqual({
        html,
        tags: [
          {
            tag: 'link',
            attrs: { rel: 'manifest', href: '/my-manifest.webmanifest' },
            injectTo: 'head',
          },
        ],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Transforming HTML: Injecting manifest link for my-manifest.webmanifest');
    });

    it('should not inject manifest link if manifest setting is not present', () => {
      const html = '<html><head></head><body></body></html>';
      const config = {
        ...mockPluginConfig,
        options: {
          ...mockPluginConfig.options,
          settings: {},
        },
      };
      const result = transformHtml(html, config);
      expect(result).toBe(html);
      expect(mockLogger.debug).toHaveBeenCalledWith('Transforming HTML: No manifest configuration found, skipping injection.');
    });

    it('should use default manifest output path if not specified', () => {
      const html = '<html><head></head><body></body></html>';
      const config = {
        ...mockPluginConfig,
        options: {
          ...mockPluginConfig.options,
          settings: {
            manifest: {},
          },
        },
      };
      const result = transformHtml(html, config);
      expect(result).toEqual({
        html,
        tags: [
          {
            tag: 'link',
            attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
            injectTo: 'head',
          },
        ],
      });
    });
  });
});
