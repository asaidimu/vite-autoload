# @asaidimu/vite-autoload

[![npm version](https://img.shields.io/npm/v/%40asaidimu%2Fvite-autoload/?style=flat-square)](https://www.npmjs.com/package/@asaidimu%2Fvite-autoload)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://github.com/asaidimu/vite-autoload/blob/main/LICENSE.md)
[![Build Status](https://img.shields.io/github/actions/workflow/status/asaidimu/vite-autoload/test.yaml?branch=main&label=build&style=flat-square)](https://github.com/asaidimu/vite-autoload/actions/workflows/test.yaml)

`@asaidimu/vite-autoload` is an enhanced Vite plugin for automatic route and module loading, designed to streamline development workflows by dynamically generating and managing application components and data based on your file system.

## Table of Contents

- [Overview & Features](#overview--features)
- [Installation & Setup](#installation--setup)
- [Usage Documentation](#usage-documentation)
  - [Integrating with Vite](#integrating-with-vite)
  - [Configuration Options](#configuration-options)
  - [Consuming Generated Modules](#consuming-generated-modules)
- [Project Architecture](#project-architecture)
  - [Core Components](#core-components)
  - [Data Flow](#data-flow)
  - [Extension Points](#extension-points)
- [Development & Contributing](#development--contributing)
  - [Development Setup](#development-setup)
  - [Scripts](#scripts)
  - [Testing](#testing)
  - [Contributing Guidelines](#contributing-guidelines)
  - [Issue Reporting](#issue-reporting)
- [Additional Information](#additional-information)
  - [Troubleshooting & Performance Optimization](#troubleshooting--performance-optimization)
  - [Changelog](#changelog)
  - [License](#license)
  - [Acknowledgments](#acknowledgments)

---

## Overview & Features

`@asaidimu/vite-autoload` is a powerful Vite plugin designed to **automate the discovery, generation, and management of application assets** such as routes, components, and data structures. It addresses the common challenge of manual import management and boilerplate code in modern web development by dynamically generating application code based on your file system or custom data sources.

This plugin streamlines development workflows by:

- **Eliminating Manual Imports and Boilerplate**: Automates the often tedious and error-prone process of defining and updating imports for routes, components, and other modules. This significantly reduces repetitive coding, allowing developers to focus on core application logic.
- **Enhancing Developer Productivity**: By automating asset management, it accelerates development cycles and iteration speeds, leading to a more efficient and productive coding experience.
- **Ensuring Type Safety for Dynamic Assets**: Automatically generates TypeScript declaration files (`.d.ts`) for all virtual modules. This provides robust type safety for dynamically loaded assets, improving code reliability and developer experience by catching potential errors at compile time.
- **Improving Project Maintainability**: As applications scale, manually maintaining large routing tables or component registries becomes challenging. The plugin's automatic generation capabilities ensure consistency and reduce long-term maintenance overhead by keeping configurations synchronized with your source files.
- **Simplifying SEO and PWA Integration**: Integrates the generation of essential web artifacts like `sitemap.xml` for search engine optimization and `manifest.webmanifest` for Progressive Web App (PWA) capabilities directly into the build pipeline, simplifying crucial setup steps.
- **Enabling Metadata-Driven Development**: Provides a robust utility for extracting structured metadata from your source files using TypeScript AST analysis and Zod schema validation. This allows for dynamic UI rendering, routing, and application logic based on declarative metadata embedded directly in your code.

By providing these capabilities, `@asaidimu/vite-autoload` facilitates more efficient development paradigms, such as:

- **File-System Driven Routing and Component Discovery**: Leverage your existing file and directory structure to automatically define routes or expose component collections, creating a natural and intuitive organization for your application.
- **Automated Data Layer Generation**: Transform file-based content (e.g., Markdown for blog posts) or programmatic data into type-safe virtual modules, providing a unified and easily consumable data layer for your application.
- **Integrated Build Artifacts**: Ensure that critical SEO and PWA files are always up-to-date and correctly generated as part of your standard build process, without requiring separate tooling or manual updates.

This plugin is designed to be a fundamental tool for developers building scalable and maintainable applications with Vite, providing a robust foundation for automated asset management.

**⚠️ Beta Notice: Rapid & Breaking Changes**
This project is currently in its early stages of development and should be considered beta software. The API and configuration options are subject to frequent and potentially breaking changes without prior notice as the project evolves (as seen in recent v3.0.0 and v4.0.0 breaking changes). While it is feature-rich, it has not yet been battle-tested in a wide range of production environments. Please use with caution, and be sure to pin a specific version in your `package.json` to avoid unexpected disruptions from new releases.

We highly encourage feedback and contributions, but please be prepared for a rapidly changing codebase.

### Key Features

- 🚀 **Automatic Route & Module Generation**: Dynamically discover and expose application routes (e.g., pages) and other reusable modules (e.g., components, hooks) from specified directories based on flexible glob patterns, or from custom data sources. This means **less manual import management and more focus on your code's core logic.**
- 📦 **Virtual Modules**: All processed data is exposed as Vite virtual modules (e.g., `virtual:views`, `virtual:components`), allowing direct and type-safe import into your application code, **reducing boilerplate and enhancing code clarity.**
- 🔄 **Hot Module Replacement (HMR)**: Provides seamless HMR for changes in watched files. When files tracked by the plugin are added, modified, or removed, virtual modules and their importers are intelligently invalidated to ensure a **fast, efficient, and uninterrupted development experience.**
- 🗺️ **Sitemap Generation**: Automatically generates a `sitemap.xml` during the build process, configured with your base URL and exclusion patterns, to **enhance SEO and improve discoverability of your application.**
- 🌐 **PWA Manifest Generation**: Integrates with Vite's build pipeline to generate a `manifest.webmanifest` file, **enabling your application to function as a Progressive Web App (PWA)** with configurable icons, display modes, and more, all with minimal effort.
- 📄 **Type Definition Generation**: Automatically generates TypeScript declaration files (`.d.ts`) for your generated modules. This **ensures strong type safety and significantly improves developer experience** when consuming the virtual modules, leading to fewer runtime errors.
- 🔑 **Metadata Extraction**: A powerful feature that allows extracting structured metadata directly from your source files (e.g., page titles, authentication requirements) using TypeScript AST analysis and validation against Zod schemas. This metadata can then be included in the generated virtual modules, **empowering dynamic content and routing decisions.**
- 🛠️ **Highly Configurable**: Offers extensive options for defining file matching rules, transforming discovered file or data, customizing output formats, and fine-tuning build-time and development-time behaviors. The plugin introduces a unified `components` model for defining module groups, replacing previous `routes` and `modules` root properties, offering **unparalleled flexibility to adapt to your project's unique needs.**

---

## Installation & Setup

### Prerequisites

- **Node.js**: LTS version (e.g., 18.x or 20.x)
- **Vite**: Version `7.0.0` or higher (as per `package.json`)
- **Package Manager**: Bun (recommended as per `package.json` scripts), npm, Yarn, or pnpm
- **TypeScript**: `~5.8.3` or higher (as per `package.json`)

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

For the full capabilities, especially metadata extraction using Zod schemas, you will also need to install these development dependencies:

```bash
# Using bun
bun add @babel/parser @babel/traverse zod --development

# Using npm
npm install --save-dev @babel/parser @babel/traverse zod
```

### Configuration

To integrate `@asaidimu/vite-autoload` into your Vite project, update your `vite.config.ts` file:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload"; // Import `extract` utility
import createAutoloadConfig from "./example.config"; // Your custom autoload config file

export default defineConfig({
  plugins: [
    // Pass the `extract` utility to your config function, as it's required by TransformConfig
    createAutoloadPlugin(createAutoloadConfig({ extract })),
  ],
});
```

Next, create an `example.config.ts` (or `autoload.config.ts`) file in your project root. This file defines how the plugin will discover, process, and expose your application's components and data. The configuration is an `object` adhering to the `PluginOptions` type.

```typescript
// example.config.ts
import { z } from "zod";
import type {
  PluginOptions,
  ComponentConfig,
  TransformConfig,
  ResolvedFile,
  ExtractFunction,
} from "@asaidimu/vite-autoload"; // Adjust import paths based on your setup

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({
  extract,
}: ConfigOptions): PluginOptions {
  // Example demonstrating file-system driven routing with metadata extraction
  const viewsTransformConfig: TransformConfig<ResolvedFile, any, any> = {
    name: "views", // This name will be used for the virtual module: `virtual:views`
    description: "Transforms UI view files into routable data.",
    input: {
      directory: "ui", // Base directory to scan, e.g., `src/ui/pages`
      match: ["**/*.ts", "**/*.tsx"], // Glob patterns to match files
      ignore: ["**/__tests__/**", "*.d.ts"], // Optional: ignore patterns for tests or type declarations
      prefix: "/_views/", // Optional: prefix for URIs in the generated output, useful for lazy loading
    },
    output: {
      // Defines the structure of the virtual module, e.g., `export const views = [{ route: '/', ... }, ...];`
      template: "export const views = {{ data }};",
      // Generates a TypeScript type like `type ViewKeys = '/home' | '/about';` for type-safe route keys.
      types: { name: "ViewKeys", property: "route" },
    },
    transform: async (item: ResolvedFile) => {
      // Custom transformation logic for each discovered file.
      // This example constructs a clean route path from the file's relative path.
      const route = item.path
        .replace(/^ui/, "") // Adjust based on your `directory` path
        .replace(/\\/g, "/") // Normalize path separators for cross-OS compatibility
        .replace(/\.tsx?$/, "") // Remove file extensions
        .replace(/\/index$/, ""); // Remove /index for root routes, e.g., `ui/home/index.tsx` becomes `/home`

      // This demonstrates the "Metadata Extraction" feature.
      // It statically analyzes `item.file` (the source file) to find an exported `metadata` constant
      // and validates it against the provided Zod schema.
      const metadata = await extract({
        filePath: item.file,
        schema: z.object({
          title: z.string().describe("Page title for display."),
          description: z
            .string()
            .optional()
            .describe("Optional page description for SEO."),
          authRequired: z
            .boolean()
            .optional()
            .describe(
              "Indicates if authentication is required for this route.",
            ),
        }),
        name: "metadata", // Looks for `export const metadata = {...}` or `export default {...}`
      });

      return {
        route: route || "/", // Ensure '/' for root path if the transformed route is empty
        path: item.uri, // The full URI for the module, useful for dynamic imports
        metadata: metadata, // The extracted and validated metadata
      };
    },
    // aggregate: (items) => { /* Optional: Custom aggregation for all transformed 'views' items */ },
  };

  // Example demonstrating "Automated Data Layer Generation" from a programmatic source.
  const dataTransformConfig: TransformConfig<Array<number>, any, any> = {
    name: "data", // This will be exposed as `virtual:data`
    description: "Generates arbitrary numeric data from a programmatic source.",
    // The `input` function can fetch data from an API, database, or generate it on the fly.
    input: () =>
      Promise.resolve(Array.from(new Array(20)).map((_, i) => i + 1)),
    output: {
      template: "export const data = {{ data }};",
    },
    transform: async (item) => {
      return item as any; // Simple passthrough for numeric data
    },
  };

  // Defines a higher-level "component" that groups related transformation configurations.
  // This helps in organizing and applying global strategies (like sitemap generation) to multiple data sources.
  const routes: ComponentConfig = {
    name: "routes", // A logical name for this high-level component category (e.g., 'routes', 'ui-modules')
    description:
      "Defines the routing structure and data for application views and pages.",
    strategy: {
      // "Sitemap Generation": Uses the `route` property from the aggregated `views` data to build sitemap entries.
      sitemap: {
        property: "route", // Property from transformed data to use for sitemap entries
      },
      // "Type Definition Generation": Creates a union type of all `route` strings found in this component's data.
      types: {
        name: "AppRouteData", // Name for the generated TypeScript type (e.g., ApplicationRoute)
        property: "route", // Property to use for type generation (e.g., 'route' will create a union type of all route strings)
      },
    },
    groups: [viewsTransformConfig, dataTransformConfig], // Includes our defined transformation groups
  };

  return {
    settings: {
      rootDir: process.cwd(), // Base directory for resolving relative paths in plugin options
      export: {
        // "Type Definition Generation": Specifies the output path for the auto-generated TypeScript types.
        types: "src/app/config/autogen.d.ts",
        routeLimit: 1000, // Limits the number of entries in generated union types, preventing excessively large types.
      },
      // "Sitemap Generation": Comprehensive configuration for the `sitemap.xml` file.
      sitemap: {
        output: "sitemap.xml", // Output filename for the sitemap (placed in Vite's build output)
        baseUrl: "[https://example.com](https://example.com)", // Base URL for sitemap entries (essential for absolute URLs)
        exclude: ["/admin/*", "/private/*"], // Glob patterns to exclude specific routes from the sitemap
      },
      // "PWA Manifest Generation": Comprehensive configuration for the `manifest.webmanifest` file.
      manifest: {
        name: "My PWA App",
        shortName: "PWA App",
        description:
          "A Progressive Web Application demonstrating vite-autoload.",
        theme_color: "#4a90e2",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        output: "manifest.webmanifest",
      },
      logLevel: "info", // 'debug', 'info', 'warn', 'error' for plugin's console output
      chunkSize: 100, // Number of items processed in a single batch for memory optimization during large scans
      watch: {
        // "Hot Module Replacement (HMR)": Debounce settings for file watcher to ensure stability and efficiency.
        debounceTime: 1000, // Debounce time for file changes (ms)
        stabilityThreshold: 300, // Time to wait for file system write stability (ms)
      },
      extract: extract, // The required metadata extraction utility
    },

    // Define different component categories and their groups
    components: [routes], // Add your defined components here
  };
}
```

### Verification

After configuring the plugin, run your Vite development server:

```bash
bun run dev
```

You should see log messages prefixed with `[vite-autoload]` in your console, indicating that the file watcher has started and modules/types are being generated. Check for any errors or warnings. During a production build (`bun run build`), the plugin will generate `sitemap.xml` and `manifest.webmanifest` in your output directory. You should also find your `autogen.d.ts` file generated at the configured path, containing types like:

```typescript
// src/app/config/autogen.d.ts (example content)
declare module "virtual:views" {
  export const views: Array<{
    route: ViewKeys;
    path: string;
    metadata: {
      title: string;
      description?: string;
      authRequired?: boolean;
    };
  }>;
}

declare module "virtual:data" {
  export const data: Array<number>;
}

type ViewKeys = "/" | "/home" | "/about" | "/products/[id]" | "/blog/post"; // Example union type
type AppRouteData = ViewKeys; // Example based on `strategy.types.name` for 'routes' component
```

---

## Usage Documentation

### Integrating with Vite

The `createAutoloadPlugin` function is the main entry point to integrate the plugin into your Vite configuration. It accepts a `PluginOptions` object that dictates how files are matched, transformed, and exposed as virtual modules.

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload";
import createAutoloadConfig from "./example.config";

export default defineConfig({
  plugins: [createAutoloadPlugin(createAutoloadConfig({ extract }))],
});
```

### Configuration Options

The `PluginOptions` object, which defines the comprehensive configuration for the plugin, is structured around `settings` (global options) and `components` (defining content categories and their transformation groups).

```typescript
interface PluginOptions {
  settings: {
    rootDir?: string;
    export?: {
      types?: string;
      routeLimit?: number;
    };
    sitemap?: SitemapConfig;
    manifest?: ManifestConfig;
    logLevel?: LogLevel;
    extract?: ExtractFunction;
    chunkSize?: number;
    watch?: WatchOptions;
  };
  components: Array<ComponentConfig>;
}

type ComponentConfig = {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  strategy: {
    sitemap?: { property: string };
    types?: { name: string; property: string };
  };
  groups: Array<TransformConfig<any, any, any>>;
};

interface TransformConfig<InputData, TransformedOutput, AggregatedOutput> {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  input: FileMatchConfig | (() => Promise<Array<InputData>> | Array<InputData>);
  output?: {
    template?: string;
    types?: { name: string; property: string };
  };
  transform?: (
    item: ResolvedFile | InputData,
    context: TransformContext,
  ) => TransformedOutput | Promise<TransformedOutput>;
  aggregate?: (
    items: Array<TransformedOutput | Promise<TransformedOutput>>,
  ) => AggregatedOutput | Promise<AggregatedOutput>;
}

// Full type definitions for `SitemapConfig`, `ManifestConfig`, `FileMatchConfig`,
// `ResolvedFile`, `TransformContext`, `ExtractFunction`, `LogLevel`, `WatchOptions`
// are available in the plugin's `src/types/` directory.
```

Let's break down the key options:

#### `settings`

A top-level object containing global configurations for the plugin.

- `rootDir`: `string` (Optional, Default: `process.cwd()`)
  The base directory from which all relative paths (e.g., for `export.types`) are resolved.
- `export`: `object` (Optional)
  Configuration for generating supplementary output files like TypeScript types, directly supporting the **"Type Definition Generation"** feature.
  - `types`: `string` (Optional)
    The file path (relative to `rootDir`) where the TypeScript declaration file (`.d.ts`) should be generated (e.g., `'src/app/config/autogen.d.ts'`). This file will contain union types for module keys based on your configuration, ensuring type safety when consuming virtual modules.
  - `routeLimit`: `number` (Optional, Default: `1000`)
    Limits the number of entries (e.g., routes) included in a generated TypeScript union type. Useful for very large projects to prevent excessively large type declarations that could impact editor performance.
- `sitemap`: `SitemapConfig` (Optional)
  Configuration for `sitemap.xml` generation, directly supporting the **"Sitemap Generation"** feature.
  - `output`: `string` - The output filename for the generated sitemap XML file (e.g., `'sitemap.xml'`). This file will be placed in your Vite build output directory.
  - `baseUrl`: `string` - The base URL of your website (e.g., `'https://example.com'`). Used to construct absolute URLs in the sitemap.
  - `exclude`: `ReadonlyArray<string>` (Optional) - An array of glob patterns or regex strings to exclude specific routes from the sitemap (e.g., `['/admin/*', '/private/*']`).
- `manifest`: `ManifestConfig` (Optional)
  Configuration for PWA Web App Manifest (`manifest.webmanifest`) generation, directly supporting the **"PWA Manifest Generation"** feature. This object directly maps to standard Web App Manifest properties. See `src/types/manifest.ts` for full details.
  - `name`: `string` - Full name of the application.
  - `shortName`: `string` (Optional) - Short name, used when space is limited.
  - `description`: `string` (Optional) - Description of the application.
  - `theme_color`: `string` (Optional) - Default theme color.
  - `background_color`: `string` (Optional) - Background color.
  - `display`: `"fullscreen" | "standalone" | "minimal-ui" | "browser"` (Optional, Default: `'standalone'`) - Preferred display mode.
  - `orientation`: `"any" | "natural" | "landscape" | "portrait"` (Optional) - Preferred orientation.
  - `scope`: `string` (Optional, Default: `'/'`) - Navigation scope.
  - `start_url`: `string` (Optional, Default: `'/'`) - URL that loads when the user launches the app.
  - `icons`: `Array<{ src: string; sizes: string; type?: string; purpose?: "any" | "maskable" | "monochrome"; }>` (Optional) - Array of icon objects.
  - `output`: `string` (Optional, Default: `'manifest.webmanifest'`) - Output filename for the manifest.
- `extract`: `(options: { filePath: string; schema: z.ZodType; name: string }) => Promise<Record<string, unknown> | null>` (Required)
  A function that provides the logic for extracting metadata from source files, a core component of the **"Metadata Extraction"** feature. The `extract` utility exported from `@asaidimu/vite-autoload` (re-exporting from `src/utils/metadata.ts`) is specifically designed for this purpose, leveraging TypeScript's AST for static analysis and Zod for validation.
  - `filePath`: The absolute path to the file to extract metadata from.
  - `schema`: A Zod schema to validate the extracted metadata against.
  - `name`: The name of the exported constant (e.g., `export const metadata = {...}` or `export default {...}`) to extract. Use `'default'` for default exports.
- `logLevel`: `LogLevel` (`'debug'` | `'info'` | `'warn'` | `'error'`) (Optional, Default: `'info'`)
  Controls the verbosity of the plugin's console output. Set to `'debug'` for detailed internal logs, useful for troubleshooting.
- `chunkSize`: `number` (Optional, Default: `100`)
  Controls the number of routes/modules processed in a single batch during the data generation phase. Adjusting this can help manage memory usage, especially for applications with a very large number of files.
- `watch`: `WatchOptions` (Optional)
  Configuration for the underlying `chokidar` file watcher, essential for **"Hot Module Replacement (HMR)"** during development.
  - `debounceTime`: `number` (Optional, Default: `1000`) - The time in milliseconds to wait before triggering an update after a file change.
  - `stabilityThreshold`: `number` (Optional, Default: `300`) - The time in milliseconds to wait for write operations to finish before processing a file change.

#### `components`

This is the core of the plugin's configuration. It is an `Array<ComponentConfig>`, where each `ComponentConfig` defines a logical category of content (e.g., "routes", "ui-modules") and how its associated groups of files or data sources should be processed. This section demonstrates the **"Highly Configurable"** nature of the plugin.

##### `ComponentConfig` Properties

- `name`: `string` (Required)
  A unique logical name for this high-level component category (e.g., `'routes'`, `'ui-modules'`, `'blog-posts'`). This name is primarily for internal organization and helps categorize groups.
- `description`: `string` (Optional)
  A brief description for this component category.
- `metadata`: `Record<string, unknown>` (Optional)
  Optional arbitrary metadata associated with this component category.
- `strategy`: `object` (Required)
  Defines the global strategy for how the groups within this component category contribute to features like sitemap or type generation.
  - `sitemap`: `object` (Optional)
    Sitemap generation output settings for this component's groups. The `property` specified here is used to find the URL for sitemap entries within the transformed data from its groups.
    - `property`: `string` - The property name from the transformed data (returned by `transform` or `aggregate`) to use for sitemap entries (e.g., `'route'` or `'url'`).
  - `types`: `object` (Optional)
    Type generation output settings for this component's groups.
    - `name`: `string` - The name of the generated TypeScript type for this component (e.g., `'ApplicationRoute'`, `'ComponentKey'`).
    - `property`: `string` - The property to extract from the transformed/aggregated data for type generation (e.g., `'route'` will create a union type of all `route` strings found in this component's data).
- `groups`: `Array<TransformConfig<any, any, any>>` (Required)
  An array of individual transformation configurations (groups) that belong to this component category. Each `TransformConfig` defines how specific input data is transformed and aggregated, directly substantiating the **"Automatic Route & Module Generation"** and **"Automated Data Layer Generation"** claims.
  - `name`: `string` (Required)
    A unique name for this specific group (e.g., `'views'`, `'pages'`, `'components'`). This name directly corresponds to the virtual module ID (e.g., `virtual:<group-name>`).
  - `description`: `string` (Optional)
    An optional description for the transformation pipeline.
  - `metadata`: `Record<string, unknown>` (Optional)
    Optional arbitrary metadata associated with this transformation pipeline.
  - `input`: `FileMatchConfig | (() => Promise<Array<InputData>> | Array<InputData>)` (Required)
    Configuration for matching input files, or a function providing direct data. This flexibility is key to **"File-System Driven Routing"** and **"Automated Data Layer Generation"**.
    - **If `FileMatchConfig` (for file-based sources):**
      - `directory`: `string` - The base directory to scan for files (e.g., `'src/pages'`).
      - `match`: `Array<string> | string` - Glob patterns (e.g., `'*.tsx'`, `'*/index.tsx'`) to match files within the `directory`.
      - `ignore`: `Array<string> | string` (Optional) - Glob patterns to exclude files from matching.
      - `prefix`: `string` (Optional) - A string prefix to add to the `uri` of resolved files (e.g., `/_assets/`). Useful for organizing dynamically imported modules.
      - `data`: `Record<string, unknown>` (Optional) - Additional static data to inject into each transformed item.
    - **If `() => Promise<Array<InputData>> | Array<InputData>` (for programmatic data sources):**
      - A function that returns an array of input data directly, allowing for non-file-system based data. This function can be `async` (e.g., fetching data from a headless CMS API at build time).
  - `output`: `object` (Optional)
    Controls the output format of the virtual module, directly supporting **"Virtual Modules"**.
    - `template`: `string` - A template string for the generated virtual module code. Use `{{ data }}` as a placeholder for the processed JSON stringified data. Example: `'export const {{ name }} = {{ data }};'`.
    - `types`: `object` (Optional) - Configuration for generating TypeScript types specific to this group, further ensuring **"Type Definition Generation"**.
      - `name`: `string` - The name of the TypeScript type to generate (e.g., `'DashboardViewData'`).
      - `property`: `string` - The property name from the transformed `item` (from the `transform` function's return value) to use for constructing the union type.
  - `transform`: `(item: ResolvedFile | InputData, context: TransformContext) => TransformedOutput | Promise<TransformedOutput>` (Optional)
    A powerful function to transform each individual `ResolvedFile` or `InputData` object into a desired custom data structure. This is where you can extract metadata (with the `extract` utility), construct routes, or format data, directly underpinning the **"Metadata Extraction"** and flexible **"Automatic Route & Module Generation"**. This function can be `async` as well.
    - `item`: The `ResolvedFile` object (for file inputs) or `InputData` object (for programmatic inputs).
    - `context`: Provides `data` (from previous transformations), `environment` (e.g., `'build'`, `'dev'`).
  - `aggregate`: `(items: Array<TransformedOutput | Promise<TransformedOutput>>) => AggregatedOutput | Promise<AggregatedOutput>` (Optional)
    A function to perform aggregation on all transformed items for a given group, combining them into a single data structure (e.g., converting an array of objects into a map keyed by a specific property). This was introduced in `v1.1.0`. This function can also be `async`.

### Consuming Generated Modules

The plugin exposes your configured groups as virtual modules. You can import them directly in your application code using the `virtual:` prefix, followed by the `name` of your group defined in `TransformConfig`. This demonstrates the **"Virtual Modules"** and **"Automated Data Layer Generation"** in action, providing type-safe and direct access to your processed assets.

```typescript
// For a group named 'views' (configured as above, likely from `src/ui/pages`):
// The 'views' object will contain the data structure returned by your 'transform' and 'aggregate' functions.
import { views } from "virtual:views";

console.log("Available Views:", views);
/*
Example output in your console (after transformation based on your files):
[
  {
    route: '/dashboard',
    path: '/_views/dashboard.js', // Path for dynamic import
    metadata: { title: 'Dashboard', authRequired: true }
  },
  {
    route: '/settings',
    path: '/_views/settings.js',
    metadata: { title: 'User Settings', description: 'Configure application preferences' }
  }
  // ... more views from your 'ui' directory
]
*/

// For a group named 'data' (from the programmatic source example defined in example.config.ts):
import { data } from "virtual:data";
console.log("Generated Data:", data);
/*
Example output:
[1, 2, 3, ..., 20]
*/

// Example of dynamically importing a view component based on the generated data:
// (Requires a routing library like React Router, Vue Router, etc.)
// In a routing setup, you might map the `route` to the actual component file:
async function loadViewComponent(routePath: ViewKeys) {
  // `ViewKeys` is type-safe due to `output.types`
  // Find the corresponding entry in the generated 'views' data
  const viewEntry = views.find((v) => v.route === routePath);
  if (!viewEntry) {
    console.error(`View for route ${routePath} not found.`);
    return null;
  }
  // Dynamically import the component using the `path` provided by the transform function
  const componentModule = await import(/* @vite-ignore */ viewEntry.path);
  return componentModule.default; // Assuming components are default exports
}

// Usage in a framework, e.g., React:
// const MyDynamicComponent = React.lazy(() => loadViewComponent('/dashboard'));
```

---

## Project Architecture

`@asaidimu/vite-autoload` is structured around a core Vite plugin that orchestrates file watching, module generation, and integrates with specialized generators for sitemaps, PWA manifests, and powerful metadata extraction. This section provides insights into how the plugin achieves its advertised features internally, demonstrating its robust design.

### Core Components

- **`createAutoloadPlugin`**: The central orchestrator of the plugin. It initializes collection generators, sets up the file watcher, registers Vite hooks, and coordinates the generation of sitemaps and PWA manifests. It manages the virtual module lifecycle and Hot Module Replacement (HMR).
- **`createCollectionGenerator`**: Responsible for discovering files based on `FileMatchConfig` or resolving data from a `DataSource` function. It applies `transform` functions to each item's data, optionally applies `aggregate` functions to the collection, and ultimately prepares the data for code generation for the virtual modules (e.g., `virtual:views`, `virtual:components`). It maintains an internal cache of resolved data.
- **`createFileResolver`**: Manages the initial discovery and ongoing tracking of files that match configured glob patterns within specified directories. It efficiently resolves paths and maintains an internal cache of `ResolvedFile` objects.
- **`createDataResolver`**: Handles the resolution of data from programmatic `DataSource` functions, caching their results.
- **`createDataProcessor`**: Handles the transformation and aggregation pipeline for the data associated with discovered files or resolved data sources. It applies the `transform` function to individual entries and the `aggregate` function to the collection of transformed data, preparing it for code generation.
- **`createCodeGenerator`**: Generates the final JavaScript code string that constitutes the virtual module, based on the processed data and an optional output template.
- **`createFileWatcher`**: Utilizes the `chokidar` library to efficiently monitor specified directories for file additions, changes, and deletions. When changes are detected, it debounces and triggers an update callback within the plugin, leading to regeneration of module data and HMR.
- **`createMetadataExtractor`**: A sophisticated utility that performs static code analysis on TypeScript files using the `typescript` AST parser. It can extract the values of specific `export const` or `export default` object literals, handling various literal types, array literals, object literals, and even transforming imported modules into dynamic import functions. Extracted data is validated against provided Zod schemas.
- **`NameIndex`**: A utility for ensuring uniqueness of component and group names within the plugin's configuration, preventing naming conflicts.

### Data Flow

1.  **Initialization**:
    - During Vite's `configResolved` hook, the plugin stores the Vite configuration.
    - On `configureServer` (development) or `buildStart` (production), `createAutoloadPlugin` initializes `createCollectionGenerator` instances for all configured `components` and their `groups`. Each generator uses an internal `FileResolver` to perform an initial file scan and `DataResolver` for programmatic data, building its cache of matched files/data.
    - Internal caches (`fileToExportMap`, `virtualModuleCache`, `importerToVirtualDeps`, `virtualModuleDeps`) are populated based on the initial file/data scan.
2.  **File Watching & HMR (Development)**:
    - `createFileWatcher` starts monitoring the directories specified in your `PluginOptions.components[].groups[].input`. This is fundamental for the **"Hot Module Replacement (HMR)"** feature.
    - When a file within a watched directory is added, changed, or removed, the watcher triggers a debounced callback.
    - The callback triggers regeneration of data for affected virtual modules within their respective `createCollectionGenerator` instances.
    - The plugin compares the new data hash with the cached hash for each virtual module. If a change is detected, it invalidates the corresponding virtual module in Vite's module graph.
    - Crucially, it also uses `es-module-lexer` to find all modules (`importers`) that `import` these virtual modules. These importers are then also invalidated, triggering a fast HMR update in the browser without a full page reload.
3.  **Virtual Module Loading**:
    - When application code imports a virtual module (e.g., `import { views } from 'virtual:views';`), Vite's `resolveId` hook routes the request to the plugin.
    - The `load` hook then uses the relevant `createCollectionGenerator` to produce the JavaScript code string containing the processed data, which Vite serves to the browser, enabling the **"Virtual Modules"** feature.
4.  **Build Phase**:
    - During `buildStart`, the plugin tells Vite to emit all source files identified by the `createCollectionGenerator` as separate chunks, allowing for optimal code splitting. It also generates the TypeScript types as part of **"Type Definition Generation"**.
    - During `closeBundle` (after Vite's main build is complete), `generateManifest` uses `PluginOptions.settings.manifest` to create `manifest.webmanifest`, and `generateSitemap` uses `PluginOptions.settings.sitemap` and the final route data to create `sitemap.xml`. These are emitted as assets, directly enabling **"Sitemap Generation"** and **"PWA Manifest Generation"**.

### Extension Points

- **`transform` Function**: This is the primary way to customize the data payload for each discovered file or data item. It allows you to define how a `ResolvedFile` object or `InputData` is processed into the desired structure, enabling custom route generation, metadata enrichment, and more. This function can be asynchronous.
- **`aggregate` Function**: Provides a powerful hook to combine all transformed items for a given group into a single, aggregated data structure. This is ideal for converting arrays of items into objects/maps keyed by a specific property, optimizing data access in your application. This function can also be asynchronous.
- **`extract` Function**: A crucial extension point for performing custom static analysis on your source files. By providing an implementation (like the one from `src/utils/metadata.ts`), you can read and validate specific exported metadata from your components or pages, making it available in the generated virtual modules. This function is asynchronous.

---

## Development & Contributing

### Development Setup

To set up the `@asaidimu/vite-autoload` project for local development:

1.  **Clone the repository**:

    ```bash
    git clone [https://github.com/asaidimu/vite-autoload.git](https://github.com/asaidimu/vite-autoload.git)
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

- `bun ci`: Installs project dependencies. Used in CI environments.
- `bun dev`: Starts the Vite development server with the plugin active, allowing you to test changes locally. This runs `vite` from the root, utilizing `vite.config.ts`.
- `bun clean`: Removes the `dist` output directory.
- `bun prebuild`: Cleans the `dist` directory and runs an internal synchronization script (`.sync-package.ts`) before building.
- `bun build`: Compiles the TypeScript source files (`src/`) into JavaScript and TypeScript declaration files (`.d.ts`) in the `dist` directory.
- `bun postbuild`: Copies essential files (`README.md`, `LICENSE.md`, `dist.package.json`, `example.config.ts`) into the `dist` directory, preparing the package for publishing.

### Testing

Currently, explicit unit or integration test files (`.test.ts`, `.spec.ts`) are not present in the provided codebase snapshot. For thorough testing of a plugin like this, you would typically include:

- **Unit Tests**: For utilities (e.g., `debounce`, `hash`, `checkers`, `logger`, `uri`) and smaller components (e.g., `metadata` extractor logic, `sitemap` generation).
- **Integration Tests**: To verify the plugin's behavior within a Vite environment, ensuring virtual modules load correctly, HMR works, and assets are generated as expected during build.

If tests were available, you would typically run them with a command like:

```bash
# Placeholder for running tests (if tests were present)
bun test
# or
npm test
```

### Contributing Guidelines

Contributions are highly welcome\! If you're interested in contributing to `@asaidimu/vite-autoload`, please follow these guidelines:

1.  **Fork the Repository**: Start by forking the [repository on GitHub](https://github.com/asaidimu/vite-autoload).
2.  **Clone Your Fork**: Clone your forked repository to your local development machine.
    ```bash
    git clone [https://github.com/YOUR_USERNAME/vite-autoload.git](https://github.com/YOUR_USERNAME/vite-autoload.git)
    cd vite-autoload
    ```
3.  **Create a New Branch**: Always create a new branch for your feature or bug fix. Use descriptive names like `feature/add-new-config-option` or `fix/hmr-issue`.
    ```bash
    git checkout -b feature/your-feature-name
    ```
4.  **Make Your Changes**: Implement your changes, ensuring they align with the existing code style and architecture.
5.  **Write Tests (if applicable)**: If you're adding new features or fixing bugs, please consider adding relevant tests to ensure correctness and prevent regressions.
6.  **Commit Messages**: Write clear, concise, and descriptive commit messages. Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) guidelines (e.g., `feat: Add new configuration option`, `fix: Resolve HMR issue`). The `package.json` `release` configuration uses `@semantic-release/commit-analyzer`, indicating strict adherence to these.
7.  **Push to Your Fork**: Push your changes to your fork on GitHub.
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Open a Pull Request**: Go to the original `@asaidimu/vite-autoload` repository on GitHub and open a Pull Request from your new branch. Provide a detailed description of your changes.

### Issue Reporting

If you encounter any bugs, have feature requests, or need assistance, please open an issue on our [GitHub Issues page](https://github.com/asaidimu/vite-autoload/issues). When reporting bugs, please provide:

- A clear and concise description of the issue.
- Steps to reproduce the behavior.
- Expected behavior.
- Actual behavior.
- Screenshots or code snippets if helpful.
- Your environment details (Node.js version, Vite version, OS).

---

## Additional Information

### Troubleshooting & Performance Optimization

This plugin is designed with performance and developer experience in mind. Here are some guidelines and troubleshooting tips to help you get the most out of it:

1.  **Memory Usage Guidelines**:
    - **Limit Watched Directories**: Configure `input.directory` and `input.ignore` precisely to only watch files and directories that are directly relevant to your generated modules. Avoid watching unnecessary large directories like `node_modules` or extensive test folders.
      ```typescript
      // In example.config.ts
      components: [
        {
          name: "routes",
          groups: [
            {
              name: "views",
              input: {
                directory: "src/app/views",
                match: ["**/*.vue", "**/*.tsx"],
                ignore: ["**/node_modules/**", "**/__tests__/**"],
              },
            },
          ],
        },
      ];
      ```
    - **Module Processing Chunking**: For very large applications with thousands of routes or modules, adjusting the `chunkSize` option in `PluginOptions.settings` can help manage memory usage by processing files in smaller batches. A smaller `chunkSize` (e.g., `50`) reduces peak memory consumption, though it might slightly increase overall processing time.
      ```typescript
      // In example.config.ts
      settings: {
        // ...
        chunkSize: 50, // Process 50 items at a time within a group
      },
      ```
    - **Type Generation Limit**: The `export.routeLimit` option (in `PluginOptions.settings.export`) helps prevent generating excessively large TypeScript union types for applications with a very high route count. Large type definitions can sometimes impact editor responsiveness and type-checking performance.
      ```typescript
      // In example.config.ts
      settings: {
        export: {
          types: 'src/types/autogen.d.ts',
          routeLimit: 500 // Limit generated route type to 500 entries
        },
        // ...
      },
      ```
2.  **File Watching Stability**: The `watch` options (`debounceTime`, `stabilityThreshold`) can be fine-tuned to improve the file watcher's responsiveness and stability, especially in environments with slow I/O or network drives, or when dealing with applications that generate many temporary files.
    - `debounceTime`: Increase this value if rapid successive file saves lead to multiple, redundant rebuilds or HMR updates.
    - `stabilityThreshold`: Increase this value if you notice that file changes are sometimes processed before the files are fully written to disk, leading to partial or empty content being read.
3.  **HMR Not Triggering Correctly**:
    - **Virtual Module Imports**: Ensure that your application's entry points or other modules actually `import` the virtual modules (e.g., `import { views } from 'virtual:views';`). The plugin's HMR mechanism relies on Vite's module graph to track importers.
    - **`logLevel` Debugging**: Set `logLevel: 'debug'` in your `PluginOptions.settings` to get detailed console output about file changes, module invalidations, and HMR events. This can help you diagnose why HMR might not be triggering as expected.
    - **Consistent Hashing**: The `getDataHash` function in `src/plugin/utils.ts` uses `JSON.stringify`. For complex data structures, inconsistent key order in stringification might lead to false positives for changes. If you experience unexpected HMR, consider a stable stringify library or a dedicated object hashing library for `getDataHash` if your data structures are highly dynamic.
4.  **Metadata Extraction Errors**:
    - **Schema Mismatch**: If your `extract` function is failing or returning unexpected results, carefully review the `schema` (Zod type) you are providing. It must accurately match the structure of the metadata object you are attempting to extract from your source files.
    - **Syntax Errors**: Ensure the source files from which you are extracting metadata have valid TypeScript/JavaScript syntax. Parsing errors in the source file can prevent metadata extraction.
    - **Static Analysis Limitations**: The `extract` utility performs static analysis of your code. It can successfully extract values from literal expressions (strings, numbers, booleans, arrays, objects) and identifiers that resolve to such literals or imported modules. It _cannot_ evaluate complex runtime logic, function calls, or dynamic computations within the metadata object.

### Changelog

For a detailed history of changes, new features, and bug fixes, please refer to the [CHANGELOG.md](https://github.com/asaidimu/vite-autoload/blob/main/CHANGELOG.md) file. Note the significant breaking changes introduced in versions `3.0.0` and `4.0.0` related to plugin configuration structure.

### License

This project is licensed under the [MIT License](https://github.com/asaidimu/vite-autoload/blob/main/LICENSE.md).

### Acknowledgments

This project is developed and maintained by Saidimu. It leverages several excellent open-source libraries and tools, including [Vite](https://vitejs.dev/), [Chokidar](https://github.com/paulmillr/chokidar), [Zod](https://zod.dev/), [es-module-lexer](https://github.com/privatenumber/es-module-lexer), [Babel](https://babeljs.io/), and [Playwright](https://playwright.dev/) (for dev environment), for which we are immensely grateful.
