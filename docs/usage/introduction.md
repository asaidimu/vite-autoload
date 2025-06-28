# Introduction

**Software Type**: Development Framework (Confidence: 95%)

The `@asaidimu/vite-autoload` is an enhanced Vite plugin designed to automate the loading and management of routes and modules within your application. It provides a robust and type-safe mechanism to define, discover, and expose application components and data based on your file system structure, significantly streamlining development and improving build performance.

Beyond basic autoloading, this plugin integrates advanced features like automatic sitemap generation for SEO, a comprehensive PWA web manifest generation, and a powerful metadata extraction system. The project also lays the groundwork for an intelligent asset manifest system, aiming to categorize assets (critical, lazy, prefetch) for smart caching and delivery strategies via an integrated service worker (note: this feature was removed in v2.0.0 and is no longer part of the plugin's scope).

### Key Features

*   🚀 **Automatic Route & Module Generation**: Dynamically discover and expose application routes (e.g., pages) and other reusable modules (e.g., components) from specified directories based on flexible glob match patterns.
*   📦 **Virtual Modules**: Exposes all processed file data as Vite virtual modules, allowing direct and type-safe import into your application code, reducing manual import management.
*   🔄 **Hot Module Replacement (HMR)**: Provides seamless HMR for changes in watched files. When files tracked by the plugin are added, modified, or removed, virtual modules and their importers are intelligently invalidated to ensure a fast and efficient development experience.
*   🗺️ **Sitemap Generation**: Automatically generates a `sitemap.xml` during the build process, configured with your base URL and exclusion patterns, to enhance SEO.
*   🌐 **PWA Manifest Generation**: Integrates with Vite's build pipeline to generate a `manifest.webmanifest` file, enabling your application to function as a Progressive Web App (PWA) with configurable icons, display modes, and more.
*   📄 **Type Definition Generation**: Automatically generates TypeScript declaration files (`.d.ts`) for your generated routes and modules. This ensures strong type safety and improves developer experience when consuming the virtual modules.
*   🔑 **Metadata Extraction**: A powerful feature that allows extracting structured metadata directly from your source files (e.g., page titles, authentication requirements) using TypeScript AST analysis and validation against Zod schemas. This metadata can then be included in the generated virtual modules.
*   🛠️ **Highly Configurable**: Offers extensive options for defining file matching rules, transforming discovered file data, customizing output formats, and fine-tuning build-time and development-time behaviors.
*   🚀 **Performance Optimization**: Includes options for chunking and file watcher stability to manage memory usage and responsiveness, especially for large applications.

---
*Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed.*