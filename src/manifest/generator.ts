import crypto from 'crypto';
import type { Manifest, Asset, ManifestConfigSchema } from './types';
import { HybridAnalyzer } from './analyzers/hybrid';
import { z } from 'zod';

export class ManifestGenerator {
  private manifest: Manifest;
  private config: z.infer<typeof ManifestConfigSchema>;
  private analyzer: HybridAnalyzer;

  constructor(
    config: z.infer<typeof ManifestConfigSchema>,
    root: string,
    baseUrl: string
  ) {
    this.config = config;
    this.manifest = this.createEmptyManifest();
    this.analyzer = new HybridAnalyzer({
      root,
      baseUrl,
      viewports: [
        { width: 1920, height: 1080 },
        { width: 375, height: 812 }
      ],
      timeout: 30000,
      maxConcurrency: 3
    });
  }

  private createEmptyManifest(): Manifest {
    const buildId = crypto.randomBytes(8).toString('hex');
    return {
      version: '1.0.0',
      buildId,
      timestamp: new Date().toISOString(),
      routes: {},
      assets: {},
      policies: {
        caching: this.config.caching ?? {
          strategy: 'cache-first',
          duration: 86400, // 24 hours
          validation: 'checksum'
        },
        prefetch: this.config.prefetch ?? {
          strategy: 'idle',
          concurrency: 3,
          timeout: 5000
        }
      }
    };
  }

  public addAsset(path: string, content: Buffer, type: string, dependencies: string[] = []): void {
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    const asset: Asset = {
      checksum,
      size: content.length,
      type,
      compression: this.detectCompression(content),
      dependencies,
      version: '1.0.0'
    };
    this.manifest.assets[path] = asset;
  }

  public addRoute(
    path: string, 
    criticalAssets: string[] = [], 
    lazyAssets: string[] = [], 
    prefetchAssets: string[] = [],
    viewport?: string,
    timing?: number
  ): void {
    this.manifest.routes[path] = {
      assets: {
        critical: criticalAssets,
        lazy: lazyAssets,
        prefetch: prefetchAssets
      },
      hints: {
        viewport: viewport ?? 'default',
        timing: timing ?? 1000
      }
    };
  }

  private detectCompression(content: Buffer): string {
    // Simple compression detection based on magic numbers
    if (content[0] === 0x1f && content[1] === 0x8b) return 'gzip';
    if (content.slice(0, 3).toString() === 'BZh') return 'bzip2';
    if (content.slice(0, 4).toString() === '\x28\xB5\x2F\xFD') return 'zstd';
    return 'none';
  }

  public getManifest(): Manifest {
    return this.manifest;
  }

  public validate(): boolean {
    if (!this.config.validation) return true;

    // Validate asset references
    for (const [path, route] of Object.entries(this.manifest.routes)) {
      const allAssets = [
        ...route.assets.critical,
        ...route.assets.lazy,
        ...route.assets.prefetch
      ];

      for (const asset of allAssets) {
        if (!this.manifest.assets[asset]) {
          throw new Error(`Route "${path}" references non-existent asset "${asset}"`);
        }
      }
    }

    // Validate dependency references
    for (const [path, asset] of Object.entries(this.manifest.assets)) {
      for (const dep of asset.dependencies) {
        if (!this.manifest.assets[dep]) {
          throw new Error(`Asset "${path}" depends on non-existent asset "${dep}"`);
        }
      }
    }

    return true;
  }

  public async serialize(): Promise<string> {
    this.validate();

    if (this.config.format === 'yaml') {
      const yaml = await import('js-yaml');
      return yaml.dump(this.manifest);
    }

    return JSON.stringify(this.manifest, null, 2);
  }

  public async analyzeRoute(route: string, entryPoint: string): Promise<void> {
    const analysis = await this.analyzer.analyzeRoute(route, entryPoint);
    
    this.addRoute(
      route,
      analysis.criticalAssets,
      analysis.lazyAssets,
      analysis.prefetchAssets,
      analysis.viewport,
      analysis.timing
    );
  }

  public async dispose(): Promise<void> {
    await this.analyzer.dispose();
  }
}
