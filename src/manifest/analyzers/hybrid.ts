import { StaticAnalyzer } from './static';
import { DynamicAnalyzer } from './dynamic';
import path from 'path';

interface HybridAnalysisOptions {
  root: string;
  baseUrl: string;
  viewports?: Array<{ width: number; height: number }>;
  networkConditions?: Array<{ latency: number; throughput: number }>;
  timeout?: number;
  maxConcurrency?: number;
}

interface AnalysisResult {
  criticalAssets: string[];
  lazyAssets: string[];
  prefetchAssets: string[];
  timing: number;
  viewport: string;
}

export class HybridAnalyzer {
  private staticAnalyzer: StaticAnalyzer;
  private dynamicAnalyzer: DynamicAnalyzer;

  constructor(private options: HybridAnalysisOptions) {
    this.staticAnalyzer = new StaticAnalyzer(options.root);
    this.dynamicAnalyzer = new DynamicAnalyzer(options.baseUrl, {
      viewports: options.viewports,
      networkConditions: options.networkConditions,
      timeout: options.timeout,
      maxConcurrency: options.maxConcurrency
    });
  }

  private categorizeAssets(
    staticAssets: string[],
    dynamicResources: { url: string; timing: number; type: string }[]
  ): {
    critical: string[];
    lazy: string[];
    prefetch: string[];
  } {
    const critical = new Set<string>();
    const lazy = new Set<string>();
    const prefetch = new Set<string>();

    // First, categorize static assets
    for (const asset of staticAssets) {
      if (asset.includes('lazy') || asset.includes('dynamic')) {
        lazy.add(asset);
      } else {
        critical.add(asset);
      }
    }

    // Then, categorize dynamic resources
    const CRITICAL_THRESHOLD = 1000; // ms
    for (const resource of dynamicResources) {
      const assetPath = new URL(resource.url).pathname;
      
      if (resource.timing <= CRITICAL_THRESHOLD) {
        critical.add(assetPath);
      } else if (resource.type === 'script' || resource.type === 'stylesheet') {
        lazy.add(assetPath);
      } else {
        prefetch.add(assetPath);
      }
    }

    return {
      critical: Array.from(critical),
      lazy: Array.from(lazy),
      prefetch: Array.from(prefetch)
    };
  }

  public async analyzeRoute(route: string, entryPoint: string): Promise<AnalysisResult> {
    // Perform static analysis
    const staticAssets = await this.staticAnalyzer.analyzeModule(
      path.join(this.options.root, entryPoint)
    );

    // Perform dynamic analysis
    const { resources, timing } = await this.dynamicAnalyzer.analyzeRoute(route);

    // Combine and categorize results
    const { critical, lazy, prefetch } = this.categorizeAssets(
      staticAssets,
      resources
    );

    // Determine optimal viewport based on analysis
    const viewport = this.determineOptimalViewport(resources);

    return {
      criticalAssets: critical,
      lazyAssets: lazy,
      prefetchAssets: prefetch,
      timing,
      viewport
    };
  }

  private determineOptimalViewport(resources: { url: string; type: string }[]): string {
    // Simple viewport determination based on image and media assets
    const hasLargeMedia = resources.some(r => 
      (r.type === 'image' || r.type === 'media') && 
      r.url.includes('large')
    );
    const hasMobileSpecific = resources.some(r => 
      r.url.includes('mobile') || 
      r.url.includes('sm')
    );

    if (hasMobileSpecific) return 'mobile';
    if (hasLargeMedia) return 'desktop';
    return 'responsive';
  }

  public async dispose() {
    await this.dynamicAnalyzer.dispose();
  }
}
