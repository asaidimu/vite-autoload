# @asaidimu/vite-autoload

[![npm version](https://img.shields.io/npm/v/%40asaidimu%2Fvite-autoload?style=flat-square)](https://www.npmjs.com/package/@asaidimu/vite-autoload)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/asaidimu/vite-autoload/blob/main/LICENSE.md)
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

Beyond basic autoloading, this plugin integrates advanced features like automatic sitemap generation for SEO, a comprehensive PWA web manifest generation, and a powerful metadata extraction system. The project also lays the groundwork for an intelligent asset manifest system, aiming to categorize assets (critical, lazy, prefetch) for smart caching and delivery strategies via an integrated service worker (currently marked as Work in Progress).

**⚠️ Beta Notice: Rapid & Breaking Changes**
This project is currently in its early stages of development and should be considered beta software. The API and configuration options are subject to frequent and potentially breaking changes without prior notice as the project evolves.
While it is feature-rich, it has not yet been battle-tested in a wide range of production environments. Please use with caution, and be sure to pin a specific version in your package.json to avoid unexpected disruptions from new releases.

We highly encourage feedback and contributions, but please be prepared for a rapidly changing codebase.

### Key Features

*   🚀 **Automatic Route & Module Generation**: Dynamically discover and expose application routes (e.g., pages) and other reusable modules (e.g., components) from specified directories based on flexible glob match patterns.
*   📦 **Virtual Modules**: Exposes all processed file data as Vite virtual modules, allowing direct and type-safe import into your application code, reducing manual import management.
*   🔄 **Hot Module Replacement (HMR)**: Provides seamless HMR for changes in watched files. When files tracked by the plugin are added, modified, or removed, virtual modules and their importers are intelligently invalidated to ensure a fast and efficient development experience.
*   🗺️ **Sitemap Generation**: Automatically generates a `sitemap.xml` during the build process, configured with your base URL and exclusion patterns, to enhance SEO.
*   🌐 **PWA Manifest Generation**: Integrates with Vite's build pipeline to generate a `manifest.webmanifest` file, enabling your application to function as a Progressive Web App (PWA) with configurable icons, display modes, and more.
*   📄 **Type Definition Generation**: Automatically generates TypeScript declaration files (`.d.ts`) for your generated routes and modules. This ensures strong type safety and improves developer experience when consuming the virtual modules.
*   🔑 **Metadata Extraction**: A powerful feature that allows extracting structured metadata directly from your source files (e.g., page titles, authentication requirements) using TypeScript AST analysis and validation against Zod schemas. This metadata can then be included in the generated virtual modules.
*   🛠️ **Highly Configurable**: Offers extensive options for defining file matching rules, transforming discovered file data, customizing output formats, and fine-tuning build-time and development-time behaviors.
*   🚀 **Performance Optimization (WIP)**: Includes provisions for future intelligent caching strategies (cache-first, network-first, stale-while-revalidate) and asset prefetching via a built-in service worker. 

---

## Installation & Setup

### Prerequisites

*   **Node.js**: LTS version (e.g., 18.x or 20.x)
*   **Vite**: Version 6.0.0 or higher
*   **Package Manager**: Bun (recommended as per `package.json` scripts), npm, Yarn, or pnpm

### Installation Steps

Install the plugin using your preferred package manager:

```bash
# Using bun (recommended)
bun add @asaidimu/vite-autoload

# Using npm
npm install @asaidimu/vite-autoload

# Using yarn
yarn add @asaidimu/vite-autoload

# Using pnpm
pnpm add @asaidimu/vite-autoload
```

For the full capabilities, especially metadata extraction using Zod schemas and potential future dynamic asset analysis, you will also need to install these development dependencies:

```bash
# Using bun
bun add @babel/parser @babel/traverse playwright zod --development

# Using npm
npm install --save-dev @babel/parser @babel/traverse playwright zod
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

Create an `autoload.config.ts` file in your project root (or wherever you prefer) to define the plugin's specific behavior. This file will export a function that returns the `PluginOptions` object:

```typescript
// autoload.config.ts (example content)
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
      routeLimit: 1000, // Optional: Limits routes included in ApplicationRoute type
    },
    sitemap: {
      output: "sitemap.xml",
      baseUrl: "https://example.com",
      exclude: ["/admin/*", "/private/*"], // Glob patterns to exclude from sitemap
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
      // Further PWA manifest options can be added here
    },
    routes: {
      views: {
        input: {
          directory: "ui",
          match: ["*.ts"],
          prefix: "/views/", // Optional: prefix for URIs
        },
        output: {
          name: "views",
          template: "export const views = {{ data }};", // Custom output template
          types: { name: "ViewKeys", key: "route" } // Generate type like `type ViewKeys = '/home' | '/about';`
        },
        transform: (view) => {
          // Custom transformation logic for each discovered view file
          const route = view.path
            .replace(/.*ui/, "") // Adjust this regex based on your base path
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, ""); // Remove index for root routes

          return {
            route: route.length === 1 ? route : route.replace(new RegExp("/?$"), ""),
            path: view.uri, // The full URI for the module
            module: route.split("/")[0], // Example: extract module name
            metadata: extract({ // Example metadata extraction
              filePath: view.file,
              schema: z.object({ 
                title: z.string(), 
                description: z.string().optional() 
              }),
              name: "metadata", // Name of the exported metadata constant/default
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
            .replace(/.*src\/interface\/pages/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");
          return {
            route: route || "/",
            path: page.uri,
            metadata: extract({
              filePath: page.file,
              schema: z.object({ title: z.string(), authRequired: z.boolean().optional() }),
              name: "metadata",
            }),
          };
        },
      },
    },
    modules: {
      // Example for a 'components' module group
      components: {
        input: {
          directory: "src/components",
          match: ["*.tsx", "*/index.tsx"],
          ignore: ["**/__tests__/**"], // Exclude test files
          prefix: "/components/"
        },
        output: {
          name: "components",
          template: "export const components = {{ data }};\nexport default components;",
          types: { name: "ComponentKeys", key: "name" } // Generates `export type ComponentKeys = 'Button' | 'Input';`
        },
        transform: (item) => ({
          name: item.path.split('/').pop()?.replace(/\.tsx?$/, ''), // Component name
          route: item.path, // Unique identifier for the component
          path: item.uri // The URI to load the component
        }),
        aggregate: (items) => items.reduce((acc, item) => ({ ...acc, [item.name!]: item.path }), {})
      },
      // You can add more module groups here (e.g., 'hooks', 'stores')
      hooks: {
        input: { directory: "src/hooks", match: ["*.ts"] },
        output: { name: "hooks" }, // Default template will be used
        transform: (item) => ({ 
          name: item.path.split('/').pop()?.replace(/\.ts$/, ''), 
          path: item.uri 
        }),
      }
    },
    logLevel: "info", // 'debug', 'info', 'warn', 'error'
    chunkSize: 100, // Number of routes/modules processed in a single batch for memory optimization
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

You should see log messages from `[vite-autoload]` in your console, indicating that the file watcher has started and modules/types are being generated. Check for any errors or warnings. During a production build (`bun run build`), the plugin will generate `sitemap.xml` and `manifest.webmanifest` in your output directory.

---

## Usage Documentation

### Integrating with Vite

The `createAutoloadPlugin` function is the main entry point to integrate the plugin into your Vite configuration. It takes a `PluginOptions` object that dictates how files are matched, transformed, and exposed as virtual modules.

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

### Configuration Options

The `PluginOptions` object, defined in `src/core/types.ts`, provides extensive control over the plugin's behavior:

#### `rootDir`
*   **Type**: `string`
*   **Default**: `process.cwd()`
*   The base directory from which all relative paths (e.g., for `export.types`) are resolved.

#### `export`
Configuration for generating supplementary output files like TypeScript types.
*   `types`: `string` (Optional) - The file path (relative to `rootDir`) where the TypeScript declaration file (`.d.ts`) should be generated (e.g., `'src/app/config/autogen.d.ts'`). This file will contain union types for routes and module keys.
*   `routeLimit`: `number` (Optional) - Default: `1000`. Limits the number of routes included in the `ApplicationRoute` type. Useful for very large projects to prevent excessively large type declarations that could impact editor performance.

#### `sitemap`
Configuration for sitemap (`sitemap.xml`) generation.
*   `output`: `string` - The output filename for the generated sitemap XML file (e.g., `'sitemap.xml'`). This file will be placed in your Vite build output directory.
*   `baseUrl`: `string` - The base URL of your website (e.g., `'https://example.com'`). Used to construct absolute URLs in the sitemap.
*   `exclude`: `ReadonlyArray<string>` (Optional) - An array of glob patterns or regex strings to exclude specific routes from the sitemap (e.g., `['/admin/*', '/private/*']`).

#### `manifest`
Configuration for PWA Web App Manifest (`manifest.webmanifest`) generation.
*   `name`: `string` - Full name of the application.
*   `shortName`: `string` (Optional) - Short name, used when space is limited.
*   `description`: `string` (Optional) - Description of the application.
*   `theme_color`: `string` (Optional) - Default theme color.
*   `background_color`: `string` (Optional) - Background color.
*   `display`: `"fullscreen" | "standalone" | "minimal-ui" | "browser"` (Optional) - Default: `'standalone'`. Preferred display mode.
*   `orientation`: `"any" | "natural" | "landscape" | "portrait"` (Optional) - Preferred orientation.
*   `scope`: `string` (Optional) - Default: `'/'`. Navigation scope.
*   `start_url`: `string` (Optional) - Default: `'/'`. URL that loads when the user launches the app.
*   `icons`: `Array<{ src: string; sizes: string; type?: string; purpose?: "any" | "maskable" | "monochrome"; }>` (Optional) - Array of icon objects.
*   `screenshots`: `Array<{ src: string; sizes: string; type?: string; platform?: string; }>` (Optional) - Array of screenshot objects.
*   `related_applications`: `Array<{ platform: string; url: string; id?: string; }>` (Optional) - Related native applications.
*   `prefer_related_applications`: `boolean` (Optional) - Hint for user agent.
*   `categories`: `Array<string>` (Optional) - Categories the app belongs to.
*   `dir`: `"auto" | "ltr" | "rtl"` (Optional) - Text direction.
*   `lang`: `string` (Optional) - Primary language.
*   `iarc_rating_id`: `string` (Optional) - IARC rating ID.
*   `output`: `string` (Optional) - Default: `'manifest.webmanifest'`. Output filename for the manifest.

#### `routes`
Defines how application routes (e.g., pages, views) are discovered, transformed, and exposed. This is an object where each key (`views`, `pages`) represents a logical group of routes.
*   `views`: `TransformConfig` - Configuration for "view" modules, typically reusable UI components or sections.
*   `pages`: `TransformConfig` - Configuration for "page" modules, typically top-level routes of your application.

#### `modules`
Similar to `routes`, but for general application modules (e.g., components, utilities, hooks) that you want to expose as virtual modules. This is an object where each key (e.g., `'components'`, `'hooks'`) represents a named module group.
*   `[key: string]`: `TransformConfig` - Each key represents a named module group.

##### `TransformConfig` Properties (for `routes` and `modules`)
*   `input`: `FileMatchConfig` - Defines which files to match.
    *   `directory`: `string` - The base directory to scan for files.
    *   `match`: `Array<string> | string` - Glob patterns (e.g., `'*.tsx'`, `'*/index.tsx'`) to match files within the `directory`.
    *   `ignore`: `Array<string> | string` (Optional) - Glob patterns to exclude files from matching.
    *   `prefix`: `string` (Optional) - A string prefix to add to the `uri` of resolved files. Useful for consistent pathing in the generated output.
    *   `data`: `Record<string, unknown>` (Optional) - Additional static data to inject into each transformed item.
*   `output`: `object` (Optional) - Controls the output format of the virtual module.
    *   `name`: `string` - The name of the JavaScript variable to export in the virtual module (e.g., `'views'`, `'pages'`, `'components'`).
    *   `template`: `string` - A template string for the generated virtual module code. Use `{{ data }}` as a placeholder for the processed JSON stringified data. Example: `'export const {{ name }} = {{ data }};'`.
    *   `types`: `object` (Optional) - Configuration for generating TypeScript types.
        *   `name`: `string` - The name of the TypeScript type to generate (e.g., `'ApplicationRoute'`, `'ComponentKeys'`).
        *   `key`: `string` - The property name from the transformed `item` (from the `transform` function's return value) to use for constructing the union type (e.g., if your transformed item has a `route` property, use `'route'`).
*   `transform`: `(item: ResolvedFile, context: TransformContext) => R` (Optional) - A powerful function to transform each `ResolvedFile` object into a desired custom data structure. This is where you can extract metadata, construct routes, etc.
    *   `item`: The `ResolvedFile` object containing `path` (relative path from `input.directory`), `uri` (absolute path for import), and `file` (absolute system path).
    *   `context`: Provides `views` (an array of `ResolvedRouteModule` from `views` processing for cross-module data access), `environment` (e.g., `'build'`, `'dev'`), and `emitFile` (a Vite function for emitting assets during build).
*   `aggregate`: `(items: R[]) => A` (Optional) - A function to perform aggregation on all transformed items (`R[]`) for a given module, combining them into a single `A` data structure (e.g., converting an array of objects into a map keyed by a specific property).
*   `importers`: `string[]` (Optional) - An array of absolute or relative paths to files that are known to import this virtual module. While the plugin uses `es-module-lexer` for dynamic import analysis for HMR, this option can provide hints or be used for custom logic if needed.

#### `extract`
*   **Type**: `(options: { filePath: string; schema: z.ZodType; name: string }) => Record<string, unknown> | null`
*   A required function that provides the logic for extracting metadata from source files. This function is typically passed from your `vite.config.ts` setup. The `extract` utility from `@asaidimu/vite-autoload/utils/metadata` is specifically designed for this purpose, leveraging TypeScript's AST for static analysis and Zod for validation.
    *   `filePath`: The absolute path to the file to extract metadata from.
    *   `schema`: A Zod schema to validate the extracted metadata against.
    *   `name`: The name of the exported constant (e.g., `export const metadata = {...}` or `export default {...}`) to extract. Use `'default'` for default exports.

#### `logLevel`
*   **Type**: `LogLevel` (`'debug'` | `'info'` | `'warn'` | `'error'`)
*   **Default**: `'info'`
*   Controls the verbosity of the plugin's console output. Set to `'debug'` for detailed internal logs.

#### `chunkSize`
*   **Type**: `number`
*   **Default**: `100`
*   Controls the number of routes/modules processed in a single batch during the data generation phase. Adjusting this can help manage memory usage, especially for applications with a very large number of files. A smaller `chunkSize` reduces peak memory consumption but might slightly increase overall processing time.

#### `watch`
Configuration for the underlying `chokidar` file watcher.
*   `debounceTime`: `number` (Optional) - Default: `1000`. The time in milliseconds to wait before triggering an update after a file change. This is useful for preventing multiple rapid updates when saving files frequently.
*   `stabilityThreshold`: `number` (Optional) - Default: `300`. The time in milliseconds to wait for write operations to finish before processing a file change. This helps ensure that files are fully written before they are read, preventing issues with incomplete file contents.

### Consuming Generated Modules

The plugin exposes your configured routes and modules as virtual modules that you can import directly in your application code using the `virtual:` prefix:

```typescript
// For routes configured under `routes.views` and `routes.pages`
// The 'views' and 'pages' objects will contain the data structures
// returned by your `transform` and `aggregate` functions.
import { views, pages } from 'virtual:routes';

console.log('Available Views:', views);
/*
Example output (after transform):
[
  { route: '/dashboard', path: '/views/dashboard.js', module: 'dashboard', metadata: { title: 'Dashboard' } },
  { route: '/settings', path: '/views/settings.js', module: 'settings', metadata: { title: 'Settings', description: 'User settings' } }
]
*/

console.log('Available Pages:', pages);
/*
Example output:
[
  { route: '/', path: '/pages/home.js', metadata: { title: 'Home', authRequired: false } },
  { route: '/admin', path: '/pages/admin/index.js', metadata: { title: 'Admin Panel', authRequired: true } }
]
*/


// For modules configured under `modules.components`
import { components } from 'virtual:components';
/*
Example output (if `aggregate` function used to create a map):
{
  Button: '/components/Button.js',
  Input: '/components/Input.js',
  Modal: '/components/Modal.js'
}
*/

// For modules configured under `modules.hooks`
import { hooks } from 'virtual:hooks';
/*
Example output (default array):
[
  { name: 'useAuth', path: '/hooks/useAuth.js' },
  { name: 'useNotifications', path: '/hooks/useNotifications.js' }
]
*/
```

---

## Project Architecture

`@asaidimu/vite-autoload` is structured around a core Vite plugin that orchestrates file watching, module generation, and integrates with specialized generators for sitemaps, PWA manifests, and powerful metadata extraction.

### Core Components

*   **`createAutoloadPlugin`** (`src/core/plugin.ts`):
    The central orchestrator of the plugin. It initializes module and route generators, sets up the file watcher, registers Vite hooks (`configResolved`, `configureServer`, `resolveId`, `load`, `transform`, `handleHotUpdate`, `buildStart`, `closeBundle`), and coordinates the generation of sitemaps and PWA manifests. It manages the virtual module lifecycle and HMR.
*   **`createModuleGenerator`** (`src/generators/module-generator.ts`):
    Responsible for discovering files based on `FileMatchConfig`, applying `transform` functions to each file's data, optionally applying `aggregate` functions, and ultimately generating the JavaScript code string for the virtual modules (e.g., `virtual:routes`, `virtual:components`). It maintains a cache of resolved files.
*   **`createFileWatcher`** (`src/watchers/file-watcher.ts`):
    Utilizes the `chokidar` library to efficiently monitor specified directories for file additions, changes, and deletions. When changes are detected, it debounces and triggers an update callback within the plugin, leading to regeneration of module data and HMR.
*   **`createMetadataExtractor`** (`src/utils/metadata.ts`):
    A sophisticated utility that performs static code analysis on TypeScript files using the `typescript` AST parser. It can extract the values of specific `export const` or `export default` object literals, handling various literal types, array literals, object literals, and even transforming imported modules into dynamic import functions. Extracted data is validated against provided Zod schemas.

### Data Flow

1.  **Initialization**:
    *   During Vite's `configResolved` hook, the plugin stores the Vite configuration.
    *   On `configureServer` (development) or `buildStart` (production), `createAutoloadPlugin` initializes `createModuleGenerator` instances for all configured `routes` and `modules`. Each generator uses `src/utils/resolver.ts` to perform an initial scan and build its internal cache of matched files.
    *   Internal caches (`fileToExportMap`, `virtualModuleCache`, `importerToVirtualDeps`, `virtualModuleDeps`) are populated based on the initial file scan.
2.  **File Watching & HMR (Development)**:
    *   `createFileWatcher` starts monitoring the directories specified in `PluginOptions.routes` and `PluginOptions.modules`.
    *   When a file (`.ts`, `.tsx`, etc.) within a watched directory is added, changed, or removed, the watcher triggers a debounced callback.
    *   The callback re-runs the `createModuleGenerator` logic, updating the internal data for affected virtual modules.
    *   `createAutoloadPlugin` compares the new data hash with the cached hash for each virtual module. If a change is detected, it invalidates the corresponding virtual module in Vite's module graph.
    *   Crucially, it also uses `es-module-lexer` to find all modules (`importers`) that `import` these virtual modules. These importers are then also invalidated, triggering a fast HMR update in the browser without a full page reload.
3.  **Virtual Module Loading**:
    *   When application code imports a virtual module (e.g., `import { views } from 'virtual:routes';`), Vite's `resolveId` hook routes the request to the plugin.
    *   The `load` hook then uses the relevant `createModuleGenerator` to produce the JavaScript code string (`modules.code()`) containing the processed data, which Vite serves to the browser.
4.  **Build Phase**:
    *   During `buildStart`, the plugin tells Vite to emit all source files identified by the `moduleGenerator` as separate chunks, allowing for optimal code splitting.
    *   During `closeBundle` (after Vite's main build is complete), `generateManifest` uses `PluginOptions.manifest` to create `manifest.webmanifest`, and `generateSitemap` uses `PluginOptions.sitemap` and the final route data to create `sitemap.xml`. These are emitted as assets.
    *   If `options.export.types` is configured, `generateTypes` writes the TypeScript declaration file based on the final processed route and module data.

### Extension Points

*   **`transform` Function**: This is the primary way to customize the data payload for each discovered file. It allows you to define how a `ResolvedFile` object is processed into the desired structure, enabling custom route generation, metadata enrichment, and more.
*   **`aggregate` Function**: Provides a powerful hook to combine all transformed items for a given module group into a single, aggregated data structure. This is ideal for converting arrays of items into objects/maps keyed by a specific property, optimizing data access in your application.
*   **`extract` Function**: A crucial extension point for performing custom static analysis on your source files. By providing an implementation (like the one from `src/utils/metadata.ts`), you can read and validate specific exported metadata from your components or pages, making it available in the generated virtual modules.

---

## Development & Contributing

### Development Setup

To set up the `@asaidimu/vite-autoload` project for local development:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/asaidimu/vite-autoload.git
    cd vite-autoload
    ```
2.  **Install dependencies**: The project uses Bun as the preferred package manager, but npm/yarn will also work.
    ```bash
    # Using bun (recommended)
    bun install

    # Or using npm
    npm install
    ```

### Scripts

The `package.json` defines several useful scripts for development and building:

*   `bun ci`: Installs project dependencies. Used in CI environments.
*   `bun dev`: Starts the Vite development server with the plugin active, allowing you to test changes locally. This runs `vite` from the root, utilizing `vite.config.ts`.
*   `bun clean`: Removes the `dist` output directory.
*   `bun prebuild`: Cleans the `dist` directory and runs an internal synchronization script (`.sync-package.ts`) before building.
*   `bun build`: Compiles the TypeScript source files (`src/`) into JavaScript and TypeScript declaration files (`.d.ts`) in the `dist` directory.
*   `bun postbuild`: Copies essential files (`README.md`, `LICENSE.md`, `dist.package.json`, `example.config.ts`) into the `dist` directory, preparing the package for publishing.

### Testing

Currently, explicit unit or integration test files (`.test.ts`, `.spec.ts`) are not present in the provided codebase snapshot. For thorough testing of a plugin like this, you would typically include:

*   **Unit Tests**: For utilities (`debounce`, `hash`, `checkers`, `logger`) and smaller components (`metadata` extractor logic, `sitemap` generation).
*   **Integration Tests**: To verify the plugin's behavior within a Vite environment, ensuring virtual modules load correctly, HMR works, and assets are generated as expected during build.

If tests were available, you would typically run them with:

```bash
# Placeholder for running tests (if tests were present)
bun test
# or
npm test
```

### Contributing Guidelines

Contributions are highly welcome! If you're interested in contributing to `@asaidimu/vite-autoload`, please follow these guidelines:

1.  **Fork the Repository**: Start by forking the [repository on GitHub](https://github.com/asaidimu/vite-autoload).
2.  **Clone Your Fork**: Clone your forked repository to your local development machine.
    ```bash
    git clone https://github.com/YOUR_USERNAME/vite-autoload.git
    cd vite-autoload
    ```
3.  **Create a New Branch**: Always create a new branch for your feature or bug fix. Use descriptive names like `feature/add-new-config-option` or `fix/hmr-issue`.
    ```bash
    git checkout -b feature/your-feature-name
    ```
4.  **Make Your Changes**: Implement your changes, ensuring they align with the existing code style and architecture.
5.  **Write Tests (if applicable)**: If you're adding new features or fixing bugs, please consider adding relevant tests to ensure correctness and prevent regressions.
6.  **Commit Messages**: Write clear, concise, and descriptive commit messages. Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines (e.g., `feat: Add new configuration option`, `fix: Resolve HMR issue`).
7.  **Push to Your Fork**: Push your changes to your fork on GitHub.
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Open a Pull Request**: Go to the original `@asaidimu/vite-autoload` repository on GitHub and open a Pull Request from your new branch. Provide a detailed description of your changes.

### Issue Reporting

If you encounter any bugs, have feature requests, or need assistance, please open an issue on our [GitHub Issues page](https://github.com/asaidimu/vite-autoload/issues). When reporting bugs, please provide:

*   A clear and concise description of the issue.
*   Steps to reproduce the behavior.
*   Expected behavior.
*   Actual behavior.
*   Screenshots or code snippets if helpful.
*   Your environment details (Node.js version, Vite version, OS).

---

## Additional Information

### Troubleshooting & Performance Optimization

This plugin is designed with performance and developer experience in mind. Here are some guidelines and troubleshooting tips to help you get the most out of it:

1.  **Memory Usage Guidelines**:
    *   **Limit Watched Directories**: Configure `input.directory` and `input.ignore` precisely to only watch files and directories that are directly relevant to your generated modules. Avoid watching unnecessary large directories like `node_modules` or extensive test folders.
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
    *   **Route/Module Processing Chunking**: For very large applications with thousands of routes or modules, adjusting the `chunkSize` option in `PluginOptions` can help manage memory usage by processing files in smaller batches. A smaller `chunkSize` (e.g., `50`) reduces peak memory consumption, though it might slightly increase overall processing time.
        ```typescript
        createAutoloadPlugin({
          // ... other options
          chunkSize: 50 // Process 50 routes/modules at a time
        });
        ```
    *   **Type Generation Limit**: The `export.routeLimit` option (in `PluginOptions.export`) helps prevent generating excessively large TypeScript union types for applications with a very high route count. Large type definitions can sometimes impact editor responsiveness and type-checking performance.
        ```typescript
        export: {
          types: 'src/types/autogen.d.ts',
          routeLimit: 500 // Limit ApplicationRoute type to 500 routes
        }
        ```
2.  **File Watching Stability**: The `watch` options (`debounceTime`, `stabilityThreshold`) can be fine-tuned to improve the file watcher's responsiveness and stability, especially in environments with slow I/O or network drives, or when dealing with applications that generate many temporary files.
    *   `debounceTime`: Increase this value if rapid successive file saves lead to multiple, redundant rebuilds or HMR updates.
    *   `stabilityThreshold`: Increase this value if you notice that file changes are sometimes processed before the files are fully written to disk, leading to partial or empty content being read.
3.  **HMR Not Triggering Correctly**:
    *   **Virtual Module Imports**: Ensure that your application's entry points or other modules actually `import` the virtual modules (e.g., `import { views } from 'virtual:routes';`). The plugin's HMR mechanism relies on Vite's module graph to track importers.
    *   **`logLevel` Debugging**: Set `logLevel: 'debug'` in your plugin options to get detailed console output about file changes, module invalidations, and HMR events. This can help you diagnose why HMR might not be triggering as expected.
4.  **Metadata Extraction Errors**:
    *   **Schema Mismatch**: If your `extract` function is failing or returning unexpected results, carefully review the `schema` (Zod type) you are providing. It must accurately match the structure of the metadata object you are attempting to extract from your source files.
    *   **Syntax Errors**: Ensure the source files from which you are extracting metadata have valid TypeScript/JavaScript syntax. Parsing errors in the source file can prevent metadata extraction.
    *   **Static Analysis Limitations**: The `extract` utility performs static analysis of your code. It can successfully extract values from literal expressions (strings, numbers, booleans, arrays, objects) and identifiers that resolve to such literals or imported modules. It cannot evaluate complex runtime logic or dynamic computations within the metadata object.

### Changelog

For a detailed history of changes, new features, and bug fixes, please refer to the [CHANGELOG.md](https://github.com/asaidimu/vite-autoload/blob/main/CHANGELOG.md) file.

### License

This project is licensed under the [MIT License](https://github.com/asaidimu/vite-autoload/blob/main/LICENSE.md).

### Acknowledgments

This project is developed and maintained by Saidimu. It leverages several excellent open-source libraries and tools, including [Vite](https://vitejs.dev/), [Chokidar](https://github.com/paulmillr/chokidar), [Zod](https://zod.dev/), [es-module-lexer](https://github.com/privatenumber/es-module-lexer), [Babel](https://babeljs.io/), and [Playwright](https://playwright.dev/), for which we are immensely grateful.
