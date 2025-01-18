# Asset Manifest System

A powerful asset management system for Vite applications that combines static analysis, dynamic browser-based asset detection, and intelligent caching strategies to optimize asset delivery and management.

## Features

- 🔍 **Hybrid Asset Analysis**
  - Static code analysis using @babel/parser
  - Dynamic browser-based analysis using Playwright
  - Intelligent asset categorization

- 📦 **Smart Asset Management**
  - Critical path optimization
  - Lazy loading support
  - Intelligent prefetching
  - Dependency tracking

- 🚀 **Performance Optimization**
  - Viewport-specific asset loading
  - Network-aware delivery
  - Intelligent caching strategies
  - Background updates

## Installation

```bash
# Using bun
bun add @asaidimu/vite-autoload

# Install development dependencies
bun add @babel/parser @babel/traverse playwright js-yaml --development
```

## Configuration

Add the manifest plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import autoload from '@asaidimu/vite-autoload';

export default defineConfig({
  plugins: [
    autoload({
      app: {
        baseUrl: 'http://localhost:3000',
        manifest: {
          output: 'dist/manifest.json',
          format: 'json',
          compression: true,
          validation: true,
          caching: {
            strategy: 'cache-first',
            duration: 86400,
            validation: 'checksum'
          },
          prefetch: {
            strategy: 'idle',
            concurrency: 3,
            timeout: 5000
          }
        }
      }
    })
  ]
});
```

## Generated Manifest

The plugin generates a comprehensive manifest file that looks like this:

```json
{
  "version": "1.0.0",
  "buildId": "a1b2c3d4",
  "timestamp": "2025-01-18T07:46:38.000Z",
  "routes": {
    "/": {
      "assets": {
        "critical": [
          "/assets/index.abc123.js",
          "/assets/vendor.xyz789.js",
          "/assets/index.def456.css"
        ],
        "lazy": [
          "/assets/feature.lazy.js",
          "/assets/images/hero.webp"
        ],
        "prefetch": [
          "/assets/about.chunk.js",
          "/assets/contact.chunk.js"
        ]
      },
      "hints": {
        "viewport": "responsive",
        "timing": 850
      }
    }
  },
  "assets": {
    "/assets/index.abc123.js": {
      "checksum": "sha256:abc123...",
      "size": 45678,
      "type": "javascript",
      "compression": "gzip",
      "dependencies": [
        "/assets/vendor.xyz789.js"
      ],
      "version": "1.0.0"
    }
  },
  "policies": {
    "caching": {
      "strategy": "cache-first",
      "duration": 86400,
      "validation": "checksum"
    },
    "prefetch": {
      "strategy": "idle",
      "concurrency": 3,
      "timeout": 5000
    }
  }
}
```

## Using the Service Worker

1. Register the service worker in your main application:

```typescript
// main.ts
if ('serviceWorker' in navigator) {
  const registration = await navigator.serviceWorker.register('/sw.js');
  
  // Handle updates
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    newWorker?.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        // New content is available
      }
    });
  });
}
```

2. Use the provided service worker API for asset management:

```typescript
const assetManager = new AssetManager();

// Prefetch assets for a route
await assetManager.prefetch('/about');

// Check asset status
const status = await assetManager.getStatus();
console.log(`Cache size: ${status.cacheSize}`);

// Update assets
await assetManager.updateAssets();
```

## API Reference

### ManifestGenerator

The core class for generating asset manifests:

```typescript
const generator = new ManifestGenerator(config, root, baseUrl);

// Analyze a route
await generator.analyzeRoute('/about', 'src/pages/about.ts');

// Get the manifest
const manifest = generator.getManifest();
```

### AssetManager

Client-side API for managing assets:

```typescript
interface AssetManager {
  register(): Promise<void>;
  prefetch(route: string): Promise<void>;
  getStatus(): Promise<AssetStatus>;
  updateAssets(): Promise<void>;
  clearCache(): Promise<void>;
}
```

## Best Practices

1. **Asset Categorization**
   - Critical assets: Core functionality and above-the-fold content
   - Lazy assets: Below-the-fold content and non-immediate features
   - Prefetch assets: Likely next-page content

2. **Caching Strategy**
   - Use checksum validation for production
   - Set appropriate cache durations
   - Implement background updates

3. **Performance**
   - Enable compression
   - Use appropriate viewport hints
   - Set reasonable prefetch concurrency limits

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see LICENSE.md for details
