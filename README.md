# @asaidimu/vite-autoload

[![npm version](https://img.shields.io/npm/v/%40asaidimu%2Fvite-autoload?style=flat-square)](https://www.npmjs.com/package/@asaidimu/vite-autoload)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE.md)
[![Build Status](https://img.shields.io/github/actions/workflow/status/asaidimu/vite-autoload/ci.yml?branch=main&label=build&style=flat-square)](https://github.com/asaidimu/vite-autoload/actions/workflows/ci.yml)

## Table of Contents

*   [Overview & Features](#overview--features)
*   [Installation & Setup](#installation--setup)
*   [Usage Documentation](#usage-documentation)
    *   [Integrating with Vite](#integrating-with-vite)
    *   [Configuration Options](#configuration-options)
        *   [`rootDir`](#rootdir)
        *   [`export`](#export)
        *   [`sitemap`](#sitemap)
        *   [`manifest`](#manifest)
        *   [`routes`](#routes)
        *   [`modules`](#modules)
        *   [`extract`](#extract)
        *   [`logLevel`](#loglevel)
        *   [`chunkSize`](#chunksize)
        *   [`watch`](#watch)
    *   [Consuming Generated Modules](#consuming-generated-modules)
    *   [Asset Manifest System](#asset-manifest-system)
        *   [Generated Manifest Structure](#generated-manifest-structure)
        *   [Using the Service Worker](#using-the-service-worker)
        *   [AssetManager API](#assetmanager-api)
*   [Project Architecture](#project-architecture)
    *   [Directory Structure](#directory-structure)
    *   [Core Components](#core-components)
    *   [Data Flow](#data-flow)
    *   [Extension Points](#extension-points)
*   [Development & Contributing](#development--contributing)
    *   [Development Setup](#development-setup)
    *   [Scripts](#scripts)
    *   [Testing](#testing)
    *   [Contributing Guidelines](#contributing-guidelines)
    *   [Issue Reporting](#issue-reporting)
*   [Additional Information](#additional-information)
    *   [Troubleshooting & Performance Optimization](#troubleshooting--performance-optimization)
    *   [Changelog](#changelog)
    *   [License](#license)
    *   [Acknowledgments](#acknowledgments)

---

## Overview & Features

`@asaidimu/vite-autoload` is an enhanced Vite plugin designed to automate the loading and management of routes and modules within your application. It provides a robust and type-safe mechanism to define, discover, and expose application components and data based on your file system structure, significantly streamlining development and improving build performance.

Beyond basic autoloading, this plugin integrates advanced features like automatic sitemap generation for SEO, a comprehensive PWA web manifest generation, and an intelligent asset manifest system. The asset manifest system uses a hybrid approach of static code analysis and dynamic browser-based analysis (powered by Playwright) to categorize assets (critical, lazy, prefetch), enabling smart caching and delivery strategies via an integrated service worker.

### Key Features

*   🚀 **Automatic Route & Module Generation**: Discover and expose routes and modules from specified directories based on flexible match patterns.
*   📦 **Virtual Modules**: Exposes processed file data as virtual modules, allowing direct import into your application code.
*   🔄 **Hot Module Replacement (HMR)**: Provides seamless HMR for changes in watched files, ensuring a fast development experience.
*   🗺️ **Sitemap Generation**: Automatically generates a `sitemap.xml` for improved SEO, configurable with base URL and exclusion patterns.
*   🌐 **PWA Manifest Generation**: Integrates with Vite's build process to generate a `manifest.webmanifest` for Progressive Web Apps.
*   📄 **Type Definition Generation**: Automatically generates TypeScript declaration files (`.d.ts`) for your generated routes and modules, ensuring type safety.
*   🔍 **Hybrid Asset Analysis (via Manifest Plugin)**:
    *   **Static Analysis (WIP)**: Uses Babel to parse import declarations, dynamic imports, and URL strings.
    *   **Dynamic Analysis (WIP)**: Leverages Playwright to simulate browser navigation, capturing network requests and resource timings for real-world asset identification.
*   ⚙️ **Intelligent Asset Categorization (WIP)**: Categorizes assets into critical, lazy, and prefetch based on analysis results and user-defined thresholds.
*   🚀 **Performance Optimization (WIP)**: Supports intelligent caching strategies (cache-first, network-first, stale-while-revalidate) and asset prefetching via a built-in service worker.
*   🛠️ **Highly Configurable**: Offers extensive options for file matching, data transformation, output formatting, and build-time behaviors.
*   🔑 **Metadata Extraction**: Allows custom metadata extraction from your source files using Zod schemas for validation.

---

## Installation & Setup

### Prerequisites

*   Node.js (LTS recommended)
*   [Vite](https://vitejs.dev/) (v6.0.0+)
*   A package manager (Bun, npm, Yarn, or pnpm)

### Installation Steps

Install the plugin using your preferred package manager:

```bash
# Using bun (recommended, as per package.json scripts)
bun add @asaidimu/vite-autoload

# Using npm
npm install @asaidimu/vite-autoload

# Using yarn
yarn add @asaidimu/vite-autoload

# Using pnpm
pnpm add @asaidimu/vite-autoload
```

For the full capabilities, especially the asset manifest generation with dynamic analysis, you will also need to install these development dependencies:

```bash
# Using bun
bun add @babel/parser @babel/traverse playwright js-yaml zod --development

# Using npm
npm install --save-dev @babel/parser @babel/traverse playwright js-yaml zod
```

### Configuration

To integrate `@asaidimu/vite-autoload` into your Vite project, update your `vite.config.ts` file:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload";
import createAutoloadConfig from "./autoload.config"; // Your custom autoload config file

export default defineConfig({
  plugins: [
    createAutoloadPlugin(createAutoloadConfig({ extract }))
  ],
});
```

Create an `autoload.config.ts` file in your project root (or anywhere you prefer) to define the plugin's behavior:

```typescript
// autoload.config.ts (example content from codebase)
import { z } from "zod";
import type { ExtractFunction, PluginOptions } from "@asaidimu/vite-autoload";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({ extract }: ConfigOptions): PluginOptions {
  return {
    rootDir: process.cwd(),
    export: {
      types: "src/app/config/autogen.d.ts", // Path for generated TypeScript types
    },
    sitemap: {
      output: "sitemap.xml",
      baseUrl: "https://example.com",
      exclude: ["/admin/*", "/private/*"], // Patterns to exclude from sitemap
    },
    manifest: {
      name: "My PWA App",
      shortName: "PWA App",
      description: "A Progressive Web Application",
      theme_color: "#4a90e2",
      background_color: "#ffffff",
      display: "standalone",
      start_url: "/",
      icons: [
        { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      output: "manifest.webmanifest",
      // Asset manifest configuration (can also be configured separately for `manifestPlugin`)
      // caching: { strategy: 'cache-first', duration: 86400, validation: 'checksum' },
      // prefetch: { strategy: 'idle', concurrency: 3, timeout: 5000 }
    },
    routes: {
      views: {
        importers: ["./ui/main.ts"], // Files that consume this virtual module
        input: {
          directory: "ui",
          match: ["*.ts"],
        },
        output: {
          name: "views",
          template: "export const views = {{ data }};",
        },
        transform: (view) => {
          const route = view.path
            .replace(/.*modules/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");
          return {
            route: route.length === 1 ? route : route.replace(new RegExp("/?$"), ""),
            path: view.uri,
            module: route.split("/")[0],
            metadata: extract({ // Example metadata extraction
              filePath: view.file,
              schema: z.object({ title: z.string(), description: z.string().optional() }),
              name: "metadata",
            }),
          };
        },
      },
      pages: {
        input: {
          directory: "src/interface/pages",
          match: ["*.tsx", "*/index.tsx"],
        },
        output: {
          name: "pages",
          template: "export const pages = {{ data }};",
        },
        transform: (page) => {
          const route = page.path
            .replace(/.*pages/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");
          return {
            route: route || "/",
            path: page.uri,
            metadata: extract({ // Example metadata extraction
              filePath: page.file,
              schema: z.object({ title: z.string(), authRequired: z.boolean().optional() }),
              name: "metadata",
            }),
          };
        },
      },
    },
    modules: {
      // Example for a 'components' module
      components: {
        input: {
          directory: "src/components",
          match: ["*.tsx", "*/index.tsx"],
          prefix: "/components/"
        },
        output: {
          name: "components",
          template: "export const components = {{ data }};",
          types: { name: "ComponentKeys", key: "route" } // Generates `export type ComponentKeys = '...' | '...';`
        },
        transform: (item) => ({
          name: item.path.split('/').pop()?.replace(/\.tsx?$/, ''),
          route: item.path // Represents the unique key for this component
        }),
        aggregate: (items) => items.reduce((acc, item) => ({ ...acc, [item.name]: item.route }), {})
      }
    },
    logLevel: "info", // 'debug', 'info', 'warn', 'error'
    chunkSize: 100, // For route processing, to optimize memory
    watch: {
      debounceTime: 1000, // Debounce time for file changes (ms)
      stabilityThreshold: 300 // Time to wait for write finish (ms)
    }
  };
}
```

### Verification

After configuration, run your Vite development server:

```bash
bun run dev
```

You should see log messages from `[vite-autoload]` indicating that the file watcher has started and modules/types are being generated. Check your console for any errors or warnings.

---

## Usage Documentation

### Integrating with Vite

The `createAutoloadPlugin` function is the main entry point to integrate the plugin into your Vite configuration. It takes a `PluginOptions` object that dictates how files are matched, transformed, and exposed.

### Configuration Options

The `PluginOptions` object provides extensive control over the plugin's behavior:

#### `rootDir`
*   Type: `string`
*   Default: `process.cwd()`
*   The base directory from which all relative paths (e.g., for `export.types`) are resolved.

#### `export`
Configuration for generating output files like TypeScript types.
*   `types`: `string` (Optional) - Path to generate a TypeScript declaration file (e.g., `'src/app/config/autogen.d.ts'`). This file will contain `export type ApplicationRoute = '/path' | '/another-path';` and other module-specific types.
*   `routeLimit`: `number` (Optional) - Default: `1000`. Limits the number of routes included in the `ApplicationRoute` type for very large projects to prevent excessive type generation.

#### `sitemap`
Configuration for sitemap generation.
*   `output`: `string` - The output path for the generated sitemap XML file (e.g., `'sitemap.xml'`).
*   `baseUrl`: `string` - The base URL of your website (e.g., `'https://example.com'`). Used to construct absolute URLs in the sitemap.
*   `exclude`: `ReadonlyArray<string>` (Optional) - An array of glob patterns or regex strings to exclude specific routes from the sitemap (e.g., `['/admin/*', '/private/*']`).

#### `manifest`
** [!WARNING] This is a work in progress
Configuration for generating a PWA web manifest file (`manifest.webmanifest`) and controlling asset manifest generation.
*   `name`: `string` - The full name of your PWA.
*   `shortName`: `string` (Optional) - A shorter name for the PWA.
*   `description`: `string` (Optional)
*   `theme_color`: `string` (Optional)
*   `background_color`: `string` (Optional)
*   `display`: `string` (Optional) - `fullscreen` | `standalone` | `minimal-ui` | `browser`.
*   `orientation`: `string` (Optional) - `any` | `natural` | `landscape` | `portrait`.
*   `scope`: `string` (Optional)
*   `start_url`: `string` (Optional)
*   `icons`: `Array<{ src: string; sizes: string; type?: string; purpose?: "any" | "maskable" | "monochrome"; }>` (Optional)
*   `screenshots`: `Array<{ src: string; sizes: string; type?: string; platform?: "wide" | "narrow" | "android" | "ios" | "windows"; }>` (Optional)
*   `related_applications`: `Array<{ platform: string; url: string; id?: string; }>` (Optional)
*   `prefer_related_applications`: `boolean` (Optional)
*   `categories`: `Array<string>` (Optional)
*   `dir`: `string` (Optional) - `auto` | `ltr` | `rtl`.
*   `lang`: `string` (Optional)
*   `iarc_rating_id`: `string` (Optional)
*   `output`: `string` (Optional) - Default: `'manifest.webmanifest'`. The output path for the generated web manifest.

**Note**: The asset manifest features (hybrid analysis, caching, prefetch policies, service worker) are part of a sub-plugin within `vite-autoload` that is configured via the `manifest` object's optional `app.manifest` property in `src/manifest/plugin.ts`. The `PluginOptions.manifest` is primarily for the *PWA Web Manifest* generation. However, the `src/manifest/plugin.ts` implies that options like `caching` and `prefetch` on `ManifestPluginOptions` (which is named `app.manifest` in the overall plugin's `manifestPlugin` usage) also configure the *asset manifest*. This integration is complex. For clarity, the top-level `manifest` option in `PluginOptions` is for `manifest.webmanifest` generation. The *Asset Manifest System* capabilities are accessed via the `manifestPlugin` itself. The codebase structure suggests this top-level `manifest` is only for the PWA manifest, while the more advanced asset manifest is managed by `src/manifest/plugin.ts` internally. The `ManifestConfigSchema` in `src/manifest/types.ts` is what `manifestPlugin` uses.

To use the advanced asset manifest features, you should configure the `ManifestPluginOptions` directly as shown in the `src/manifest/README.md`. It seems there's a slight overlap/confusion in the `manifest` naming. The codebase is indicating a specific path for the manifest plugin's options that seems to be internal to `vite-autoload`'s `manifestPlugin` and not directly exposed at the root `PluginOptions.manifest`. This should be noted for future clarification or refactoring. For now, we'll document the primary `manifest` option in `PluginOptions` as for the PWA Web Manifest.

#### `routes`
Defines how application routes (e.g., pages, views) are discovered and processed.
*   `views`: `TransformConfig` - Configuration for "view" modules, typically reusable UI components or sections.
*   `pages`: `TransformConfig` - Configuration for "page" modules, typically top-level routes of your application.

Each `TransformConfig` for `routes` or `modules` has the following properties:
*   `input`: `FileMatchConfig`
    *   `directory`: `string` - The base directory to scan for files.
    *   `match`: `Array<string> | string` - Glob patterns (e.g., `'*.tsx'`, `'*/index.tsx'`) to match files within the `directory`.
    *   `ignore`: `Array<string> | string` (Optional) - Glob patterns to exclude files.
    *   `prefix`: `string` (Optional) - A prefix to add to the `uri` of resolved files.
    *   `data`: `Record<string, unknown>` (Optional) - Additional static data to inject.
*   `output`: `object` (Optional)
    *   `name`: `string` - The name of the JavaScript variable to export in the virtual module (e.g., `'views'`, `'pages'`).
    *   `template`: `string` - A template string for the generated virtual module code, using `{{ data }}` as a placeholder for the processed data.
    *   `types`: `object` (Optional) - For type generation.
        *   `name`: `string` - The name of the TypeScript type to generate (e.g., `'ApplicationRoute'`, `'ComponentKeys'`).
        *   `key`: `string` - The property name from the transformed `item` to use for the union type (e.g., if your transformed item has a `route` property, use `'route'`).
*   `transform`: `(item: ResolvedFile, context: TransformContext) => R` (Optional) - A function to transform each resolved file into a desired data structure.
    *   `item`: The `ResolvedFile` object containing `path`, `uri`, `file`.
    *   `context`: Provides `views` (an array of `ResolvedRouteModule` from `views` processing), `environment`, and `emitFile`.
*   `aggregate`: `(items: R[]) => A` (Optional) - A function to perform aggregation on all transformed items for a given module (e.g., converting an array into a map).
*   `importers`: `string[]` (Optional) - Paths to files that explicitly import this virtual module. Used for more accurate HMR.

#### `modules`
Similar to `routes`, but for general application modules (e.g., components, utilities) that you want to expose as virtual modules.
*   `[key: string]`: `TransformConfig` - Each key represents a named module group (e.g., `'components'`, `'helpers'`).

#### `extract`
*   Type: `(options: { filePath: string; schema: z.ZodType; name: string }) => Record<string, unknown>`
*   A required function that provides the logic for extracting metadata from source files. This function is typically passed from your `vite.config.ts` setup. The `extract` utility from `@asaidimu/vite-autoload/utils/metadata` is designed for this purpose.

#### `logLevel`
*   Type: `LogLevel` (`'debug'` | `'info'` | `'warn'` | `'error'`)
*   Default: `'info'`
*   Controls the verbosity of the plugin's console output.

#### `chunkSize`
*   Type: `number`
*   Default: `100`
*   Controls the number of routes/modules processed in a single batch during generation, which can help manage memory usage for very large applications.

#### `watch`
Configuration for the underlying file watcher.
*   `debounceTime`: `number` (Optional) - Default: `1000`. The time in milliseconds to wait before triggering an update after a file change (useful for preventing multiple rapid updates).
*   `stabilityThreshold`: `number` (Optional) - Default: `300`. The time in milliseconds to wait for write operations to finish before processing a file change.

### Consuming Generated Modules

The plugin exposes your configured routes and modules as virtual modules that you can import directly in your application code:

```typescript
// For routes configured under `routes.views` and `routes.pages`
import { views, pages } from 'virtual:routes';

console.log('Available Views:', views);
// Example: { route: '/dashboard', path: '/src/views/dashboard.tsx', metadata: { title: 'Dashboard' } }

console.log('Available Pages:', pages);
// Example: { route: '/', path: '/src/pages/home.tsx', metadata: { layout: 'default' } }

// For modules configured under `modules.components`
import { components } from 'virtual:components';
// If aggregate function used, could be: { Button: '/src/components/Button.tsx', Input: '/src/components/Input.tsx' }
```

### Asset Manifest System

The plugin integrates a powerful Asset Manifest System, defined in `src/manifest`, to provide intelligent asset delivery and caching.

#### Generated Manifest Structure

The plugin generates a `manifest.json` (or `manifest.yaml`) file during the build process, describing your application's assets and routes. This manifest is designed to be consumed by a service worker for advanced caching and prefetching.

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
    },
    // ... more assets
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

#### Using the Service Worker

1.  **Register the service worker** in your main application entry point (e.g., `main.ts`):

    ```typescript
    // main.ts
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);

            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker?.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New content is available, notify user to refresh
                    console.log('New content available! Please refresh.');
                    // You might want to show a UI prompt here
                  } else {
                    // Content is cached for offline use.
                    console.log('Content is cached for offline use.');
                  }
                }
              });
            });
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }
    ```

    The `src/manifest/example.webworker.ts` provides a complete implementation of the service worker, which you can use directly. You might need to copy this file to your `public` directory and ensure Vite copies it to `dist/sw.js` during build.

2.  **Refer to the manifest plugin's `README.md`** (`src/manifest/README.md`) for more specific instructions on setting up the asset manifest and service worker, as it's a dedicated sub-system within this plugin.

#### AssetManager API

The service worker exposes messages that allow client-side interaction for asset management. You can create a simple API to interact with it:

```typescript
// Example AssetManager client-side API
interface AssetStatus {
  version: string;
  cacheSize: number;
  lastUpdate: string;
  pendingUpdates: boolean;
}

class AssetManager {
  private swController: ServiceWorker | null = null;

  constructor() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        this.swController = registration.active;
      });
    }
  }

  private sendMessage(type: string, payload?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.swController) {
        return reject('Service Worker not active.');
      }
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = event => {
        if (event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };
      this.swController.postMessage({ type, payload }, [messageChannel.port2]);
    });
  }

  /** Prefetches assets for a given route. */
  async prefetch(route: string): Promise<void> {
    await this.sendMessage('PREFETCH', { route });
  }

  /** Checks for and applies updates to the manifest and assets. */
  async updateAssets(): Promise<void> {
    await this.sendMessage('UPDATE');
  }

  /** Clears the service worker's asset cache. */
  async clearCache(): Promise<void> {
    await this.sendMessage('CLEAR');
  }

  /** Gets the current status of the asset manager. */
  async getStatus(): Promise<AssetStatus> {
    return this.sendMessage('STATUS');
  }
}

// Usage Example:
const assetManager = new AssetManager();

(async () => {
  await assetManager.prefetch('/about');
  console.log('Prefetch for /about triggered.');

  const status = await assetManager.getStatus();
  console.log(`Current cache size: ${status.cacheSize / 1024 / 1024} MB`);

  // To trigger an update check
  // await assetManager.updateAssets();
})();
```

---

## Project Architecture

`@asaidimu/vite-autoload` is structured around a core plugin that orchestrates file watching, module generation, and integrates with specialized generators for sitemaps, PWA manifests, and asset manifests.

### Directory Structure

```
vite-autoload/
├── src/
│   ├── core/                       # Core plugin logic, types, and logger
│   │   ├── plugin.ts               # Main Vite plugin implementation
│   │   ├── types.ts                # Shared TypeScript types and interfaces
│   │   └── logger.ts               # Custom logger utility
│   ├── generators/                 # Code generation utilities
│   │   ├── module-generator.ts     # Generates virtual module code for routes/modules
│   │   ├── sitemap-generator.ts    # Generates sitemap.xml
│   │   ├── types-generator.ts      # Generates TypeScript declaration files (.d.ts)
│   │   └── manifest-generator.ts   # Generates PWA manifest.webmanifest (basic)
│   ├── manifest/                   # Advanced Asset Manifest System
│   │   ├── analyzers/              # Static, Dynamic, and Hybrid asset analysis
│   │   │   ├── static.ts
│   │   │   ├── dynamic.ts
│   │   │   └── hybrid.ts
│   │   ├── example.webworker.ts    # Example service worker for asset management
│   │   ├── generator.ts            # Core logic for building the asset manifest
│   │   ├── plugin.ts               # Vite plugin for asset manifest generation
│   │   ├── types.ts                # Zod schemas and types for asset manifest
│   │   └── README.md               # Dedicated README for asset manifest system
│   ├── utils/                      # General utilities
│   │   ├── crypto.ts               # MD5 hash generation
│   │   ├── debounce.ts             # Debounce utility
│   │   ├── metadata.ts             # TypeScript AST-based metadata extractor
│   │   └── resolver.ts             # File resolution using fast-glob
│   └── watchers/                   # File system watcher
│       └── file-watcher.ts         # Chokidar-based file watcher
├── index.ts                        # Main plugin entry point
├── package.json                    # Project metadata and dependencies
├── vite.config.ts                  # Example Vite configuration
├── example.config.ts               # Example autoload plugin configuration
├── CHANGELOG.md                    # Version history
├── LICENSE.md                      # Project license
└── ...
```

### Core Components

*   `createAutoloadPlugin` (`src/core/plugin.ts`): The heart of the plugin. It initializes module and route generators, sets up file watching, handles Vite hooks (`resolveId`, `load`, `transform`, `handleHotUpdate`, `closeBundle`), and orchestrates the generation of sitemaps and manifests.
*   `createModuleGenerator` (`src/generators/module-generator.ts`): Responsible for finding, processing, and generating the JavaScript code for virtual modules (e.g., `virtual:routes`, `virtual:components`). It supports `transform` and `aggregate` functions for flexible data structuring.
*   `createFileWatcher` (`src/watchers/file-watcher.ts`): Utilizes `chokidar` to monitor specified directories for file additions, changes, and deletions, triggering updates to the plugin's internal state and HMR.
*   `createMetadataExtractor` (`src/utils/metadata.ts`): A powerful utility that uses TypeScript's AST to extract specific `export const` or `export default` objects from `.ts`/`.tsx` files. It handles dynamic imports and transforms them into import functions, validated against Zod schemas.
*   `ManifestGenerator` (`src/manifest/generator.ts`): This class builds the comprehensive asset manifest. It leverages `HybridAnalyzer` to collect asset information.
*   `HybridAnalyzer` (`src/manifest/analyzers/hybrid.ts`): Coordinates static analysis (using `@babel/parser`) and dynamic analysis (using `playwright`) to identify and categorize assets (critical, lazy, prefetch) for each route.
*   `manifestPlugin` (`src/manifest/plugin.ts`): A standalone Vite plugin (used internally by `createAutoloadPlugin`) specifically for generating the advanced asset manifest, hooking into Vite's `generateBundle` and `handleHotUpdate` lifecycle.

### Data Flow

1.  **Initialization**: On `configureServer` (dev) or `buildStart` (build), `createAutoloadPlugin` initializes `createModuleGenerator` instances for configured `routes` and `modules`. It uses `src/utils/resolver.ts` to find initial files.
2.  **File Watching**: `createFileWatcher` monitors relevant directories. Any file changes (add, change, unlink) trigger a debounced update.
3.  **Data Regeneration**: Upon file changes, the `createModuleGenerator` instances re-scan and re-process their respective files, applying `transform` and `aggregate` functions.
4.  **HMR (Development)**: If a virtual module's data changes, `createAutoloadPlugin` invalidates the corresponding virtual module in Vite's module graph and its importers, triggering HMR updates in the browser.
5.  **Type Generation**: If configured, new TypeScript declaration files are generated based on the latest module data.
6.  **Build Phase**:
    *   `buildStart`: Virtual module files are emitted as chunks for production.
    *   `generateBundle` (from `manifestPlugin`): The `ManifestGenerator` analyzes emitted assets and routes, leveraging `HybridAnalyzer` for detailed insights.
    *   `closeBundle`: PWA `manifest.webmanifest` and `sitemap.xml` are generated and emitted as assets.

### Extension Points

*   **`transform` function**: Allows you to customize the data structure for each file found by the plugin, enabling rich metadata injection and path manipulation.
*   **`aggregate` function**: Provides a hook to combine all transformed items for a given module into a single, cohesive data structure (e.g., an array to an object map).
*   **`extract` function**: A crucial extension point for extracting custom metadata from your source files using your preferred schema validation (e.g., Zod). This allows for powerful static analysis of your code.

---

## Development & Contributing

### Development Setup

To set up the project for local development:

```bash
# Clone the repository
git clone https://github.com/asaidimu/vite-autoload.git
cd vite-autoload

# Install dependencies using bun (preferred)
bun install

# Or using npm
npm install
```

### Scripts

The `package.json` defines several useful scripts:

*   `bun ci`: Installs dependencies.
*   `bun dev`: Starts the Vite development server with the plugin active (for testing changes locally).
*   `bun clean`: Removes the `dist` directory.
*   `bun prebuild`: Cleans `dist` and runs `.sync-package.ts` (internal synchronization).
*   `bun build`: Compiles TypeScript source files to the `dist` directory.
*   `bun postbuild`: Copies `README.md`, `LICENSE.md`, `dist.package.json`, and `example.config.ts` to the `dist` directory.

### Testing

Currently, the codebase snapshot does not include explicit test files (`.test.ts`, `.spec.ts`). For thorough testing, you would typically run:

```bash
# Placeholder for running tests (if tests were present)
bun test
# or
npm test
```

### Contributing Guidelines

Contributions are welcome! Please follow these steps to contribute:

1.  **Fork** the repository on GitHub.
2.  **Clone** your forked repository to your local machine.
3.  Create a new **feature branch** (`git checkout -b feature/your-feature-name`).
4.  Make your changes and ensure they adhere to the project's coding standards.
5.  Write clear and concise **commit messages**.
6.  **Push** your branch to your forked repository.
7.  Open a **Pull Request** to the `main` branch of the original repository.

### Issue Reporting

If you encounter any bugs, have feature requests, or need assistance, please open an issue on our [GitHub Issues page](https://github.com/asaidimu/vite-autoload/issues). Provide as much detail as possible, including steps to reproduce bugs and relevant code snippets.

---

## Additional Information

### Troubleshooting & Performance Optimization

This plugin is designed with performance in mind. Here are some guidelines and troubleshooting tips:

1.  **Memory Usage Guidelines**:
    *   **Limit Watch Directories**: Configure `input.directory` and `input.ignore` precisely to only watch relevant files and directories. Avoid watching `node_modules` or large test directories.
        ```typescript
        routes: {
          views: {
            input: {
              directory: 'src/app/views',
              match: ['**/*.vue', '**/*.tsx'],
              ignore: ['**/node_modules/**', '**/__tests__/**']
            }
          }
        }
        ```
    *   **Route/Module Processing Chunking**: The plugin processes files in chunks to prevent memory spikes. Adjust the `chunkSize` option in your `PluginOptions` if you have an extremely large number of routes/modules or are in memory-constrained environments. A smaller `chunkSize` (e.g., 50) reduces peak memory but might slightly increase overall processing time.
        ```typescript
        createAutoloadPlugin({
          // ... other options
          chunkSize: 50 // Process 50 routes/modules at a time
        });
        ```
    *   **Type Generation Limit**: The `export.routeLimit` option helps prevent generating excessively large TypeScript types for very high route counts, which can consume significant memory during type checking.
        ```typescript
        export: {
          types: 'src/types/autogen.d.ts',
          routeLimit: 500 // Limit type generation to 500 routes
        }
        ```
2.  **File Watching Stability**: The `watch` options (`debounceTime`, `stabilityThreshold`) can be adjusted to fine-tune the file watcher's responsiveness and stability, especially on network drives or with rapid file changes.
    *   `debounceTime`: Increase this if rapid successive file saves cause multiple unnecessary rebuilds.
    *   `stabilityThreshold`: Increase this if files are sometimes processed before they are fully written, leading to partial or empty content.
3.  **HMR Not Triggering**:
    *   Ensure your consuming files (e.g., `main.ts`, `App.vue`) actually `import` the virtual modules (e.g., `import { views } from 'virtual:routes';`).
    *   Check your `importers` array in `TransformConfig` for correct paths.
    *   Verify `logLevel: 'debug'` to see detailed HMR invalidation logs.
4.  **Metadata Extraction Errors**:
    *   If your `extract` function is failing, ensure the `schema` provided matches the actual structure of the metadata you are trying to extract from your source files.
    *   Check for syntax errors in the source files being analyzed.
    *   The `extract` utility only reads static object literals or function returns that can be statically evaluated. Complex runtime logic might not be correctly extracted.

### Changelog

For a detailed history of changes, new features, and bug fixes, please refer to the [CHANGELOG.md](CHANGELOG.md) file.

### License

This project is licensed under the [MIT License](LICENSE.md).

### Acknowledgments

This project is developed and maintained by Saidimu. It leverages several open-source libraries and tools, including Vite, Playwright, Babel, Chokidar, and Zod, for which we are grateful.
