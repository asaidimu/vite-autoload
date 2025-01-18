/// <reference lib="webworker" />

interface ManifestData {
  version: string;
  buildId: string;
  routes: Record<string, {
    assets: {
      critical: string[];
      lazy: string[];
      prefetch: string[];
    };
    hints: {
      viewport: string;
      timing: number;
    };
  }>;
  assets: Record<string, {
    checksum: string;
    size: number;
    type: string;
    compression: string;
    dependencies: string[];
    version: string;
  }>;
  policies: {
    caching: {
      strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
      duration: number;
      validation: 'checksum' | 'time-based' | 'none';
    };
    prefetch: {
      strategy: 'idle' | 'eager' | 'on-demand';
      concurrency: number;
      timeout: number;
    };
  };
}

class AssetWorker {
  private manifest?: ManifestData;
  private cache?: Cache;
  private prefetchQueue: Set<string> = new Set();
  private updating = false;

  constructor() {
    self.addEventListener('install', this.handleInstall.bind(this));
    self.addEventListener('activate', this.handleActivate.bind(this));
    self.addEventListener('fetch', this.handleFetch.bind(this));
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleInstall(event: ExtendableEvent): Promise<void> {
    // Preload manifest
    event.waitUntil(this.loadManifest());
  }

  private async handleActivate(event: ExtendableEvent): Promise<void> {
    // Clean up old caches
    event.waitUntil(this.cleanupCaches());
  }

  private async handleFetch(event: FetchEvent): Promise<void> {
    const request = event.request;
    
    // Only handle GET requests
    if (request.method !== 'GET') return;

    event.respondWith(this.handleAssetRequest(request));
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const { type, payload } = event.data;

    switch (type) {
      case 'PREFETCH':
        await this.prefetchRoute(payload.route);
        break;
      case 'UPDATE':
        await this.checkForUpdates();
        break;
      case 'CLEAR':
        await this.clearCache();
        break;
      case 'STATUS':
        const status = await this.getStatus();
        event.ports[0]?.postMessage(status);
        break;
    }
  }

  private async loadManifest(): Promise<void> {
    const response = await fetch('/manifest.json');
    this.manifest = await response.json();
    this.cache = await caches.open(`assets-${this.manifest.buildId}`);
  }

  private async cleanupCaches(): Promise<void> {
    const currentCacheName = `assets-${this.manifest?.buildId}`;
    const keys = await caches.keys();
    
    await Promise.all(
      keys
        .filter(key => key.startsWith('assets-') && key !== currentCacheName)
        .map(key => caches.delete(key))
    );
  }

  private async handleAssetRequest(request: Request): Promise<Response> {
    if (!this.manifest || !this.cache) {
      return fetch(request);
    }

    const url = new URL(request.url);
    const asset = this.manifest.assets[url.pathname];

    if (!asset) {
      return fetch(request);
    }

    switch (this.manifest.policies.caching.strategy) {
      case 'cache-first':
        return this.handleCacheFirst(request, asset);
      case 'network-first':
        return this.handleNetworkFirst(request, asset);
      case 'stale-while-revalidate':
        return this.handleStaleWhileRevalidate(request, asset);
      default:
        return fetch(request);
    }
  }

  private async handleCacheFirst(request: Request, asset: ManifestData['assets'][string]): Promise<Response> {
    const cached = await this.cache!.match(request);
    if (cached) {
      // Validate cached response
      if (this.isValidCachedResponse(cached, asset)) {
        return cached;
      }
    }
    
    // Fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      await this.cache!.put(request, response.clone());
    }
    return response;
  }

  private async handleNetworkFirst(request: Request, asset: ManifestData['assets'][string]): Promise<Response> {
    try {
      const response = await fetch(request);
      if (response.ok) {
        await this.cache!.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await this.cache!.match(request);
      if (cached && this.isValidCachedResponse(cached, asset)) {
        return cached;
      }
      throw error;
    }
  }

  private async handleStaleWhileRevalidate(request: Request, asset: ManifestData['assets'][string]): Promise<Response> {
    const cached = await this.cache!.match(request);
    
    const networkPromise = fetch(request).then(async response => {
      if (response.ok) {
        await this.cache!.put(request, response.clone());
      }
      return response;
    });

    return cached && this.isValidCachedResponse(cached, asset)
      ? cached
      : networkPromise;
  }

  private isValidCachedResponse(response: Response, asset: ManifestData['assets'][string]): boolean {
    if (!this.manifest) return false;

    switch (this.manifest.policies.caching.validation) {
      case 'checksum':
        return response.headers.get('etag') === asset.checksum;
      case 'time-based':
        const cachedTime = new Date(response.headers.get('date') || 0).getTime();
        return Date.now() - cachedTime < this.manifest.policies.caching.duration * 1000;
      case 'none':
        return true;
      default:
        return false;
    }
  }

  private async prefetchRoute(route: string): Promise<void> {
    if (!this.manifest || this.prefetchQueue.has(route)) return;

    const routeData = this.manifest.routes[route];
    if (!routeData) return;

    this.prefetchQueue.add(route);

    const prefetchAssets = async (assets: string[]) => {
      const { concurrency } = this.manifest!.policies.prefetch;
      
      // Chunk assets into groups based on concurrency
      for (let i = 0; i < assets.length; i += concurrency) {
        const chunk = assets.slice(i, i + concurrency);
        await Promise.all(
          chunk.map(async asset => {
            try {
              const response = await fetch(asset);
              if (response.ok) {
                await this.cache!.put(asset, response);
              }
            } catch (error) {
              console.warn(`Failed to prefetch ${asset}:`, error);
            }
          })
        );
      }
    };

    try {
      // Prefetch in order of importance
      await prefetchAssets(routeData.assets.prefetch);
    } finally {
      this.prefetchQueue.delete(route);
    }
  }

  private async checkForUpdates(): Promise<void> {
    if (this.updating) return;
    this.updating = true;

    try {
      const response = await fetch('/manifest.json');
      const newManifest: ManifestData = await response.json();

      if (newManifest.buildId !== this.manifest?.buildId) {
        // Notify clients of update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            payload: { version: newManifest.version }
          });
        });
      }
    } finally {
      this.updating = false;
    }
  }

  private async clearCache(): Promise<void> {
    if (!this.cache) return;
    
    const keys = await this.cache.keys();
    await Promise.all(keys.map(key => this.cache!.delete(key)));
  }

  private async getStatus(): Promise<{
    version: string;
    cacheSize: number;
    lastUpdate: string;
    pendingUpdates: boolean;
  }> {
    if (!this.manifest || !this.cache) {
      return {
        version: '0.0.0',
        cacheSize: 0,
        lastUpdate: new Date(0).toISOString(),
        pendingUpdates: false
      };
    }

    const keys = await this.cache.keys();
    const cacheSize = (await Promise.all(
      keys.map(async key => {
        const response = await this.cache!.match(key);
        const blob = await response!.blob();
        return blob.size;
      })
    )).reduce((a, b) => a + b, 0);

    return {
      version: this.manifest.version,
      cacheSize,
      lastUpdate: this.manifest.timestamp,
      pendingUpdates: this.updating
    };
  }
}

// Initialize the worker
new AssetWorker();

export type { ManifestData };
