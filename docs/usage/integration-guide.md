# Integration Guide

## Environment Requirements

The plugin is designed to run within a Node.js environment (LTS version, v18 or higher) as part of a Vite project (v6.0.0 or higher). It requires a modern JavaScript runtime with ES module support. No specific compiler settings are strictly enforced beyond what Vite typically requires, but the use of TypeScript is integral for the `extract` function's static analysis capabilities.

## Initialization Patterns

### Integrating the `@asaidimu/vite-autoload` plugin into your Vite project's `vite.config.ts`.
```[DETECTED_LANGUAGE]
import { defineConfig } from "vite";
import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload";
import createAutoloadConfig from "./autoload.config"; // Your custom autoload config file

export default defineConfig({
  plugins: [
    createAutoloadPlugin(createAutoloadConfig({ extract }))
  ],
});
```

### Defining the `PluginOptions` in a dedicated configuration file (`autoload.config.ts`). This is where all the logic for file matching, transformation, and output generation is set up.
```[DETECTED_LANGUAGE]
import { z } from "zod";
import type { ExtractFunction, PluginOptions } from "@asaidimu/vite-autoload";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({ extract }: ConfigOptions): PluginOptions {
  return {
    rootDir: process.cwd(),
    export: {
      types: "src/app/config/autogen.d.ts",
      routeLimit: 1000,
    },
    sitemap: {
      output: "sitemap.xml",
      baseUrl: "https://example.com",
      exclude: ["/admin/*", "/private/*"],
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
    },
    routes: {
      views: {
        input: {
          directory: "ui",
          match: ["*.ts"],
          prefix: "/views/",
        },
        output: {
          name: "views",
          template: "export const views = {{ data }};",
          types: { name: "ViewKeys", key: "route" }
        },
        transform: (view) => {
          const route = view.path
            .replace(/.*ui/, "")
            .replace(/\\/g, "/")
            .replace(/\.tsx?$/, "")
            .replace(/index.?$/, "");

          return {
            route: route.length === 1 ? route : route.replace(new RegExp("/$"), ""),
            path: view.uri,
            module: route.split("/")[0],
            metadata: extract({
              filePath: view.file,
              schema: z.object({ 
                title: z.string(), 
                description: z.string().optional() 
              }),
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
      components: {
        input: {
          directory: "src/components",
          match: ["*.tsx", "*/index.tsx"],
          ignore: ["**/__tests__/**"],
          prefix: "/components/"
        },
        output: {
          name: "components",
          template: "export const components = {{ data }};\nexport default components;",
          types: { name: "ComponentKeys", key: "name" }
        },
        transform: (item) => ({
          name: item.path.split('/').pop()?.replace(/\.tsx?$/, ''),
          route: item.path,
          path: item.uri
        }),
        aggregate: (items) => items.reduce((acc, item) => ({ ...acc, [item.name!]: item.path }), {})
      },
      hooks: {
        input: { directory: "src/hooks", match: ["*.ts"] },
        output: { name: "hooks" },
        transform: (item) => ({
          name: item.path.split('/').pop()?.replace(/\.ts$/, ''),
          path: item.uri
        }),
      }
    },
    logLevel: "info",
    chunkSize: 100,
    watch: {
      debounceTime: 1000,
      stabilityThreshold: 300
    }
  };
}
```

## Common Integration Pitfalls

- **Issue**: Incorrect `rootDir` or relative paths.
  - **Solution**: Ensure `rootDir` is correctly set if your `autoload.config.ts` is not in the project root. All relative paths for `export.types` should be relative to `rootDir`.

- **Issue**: File watcher not triggering HMR.
  - **Solution**: Ensure your application code actually imports the virtual modules (e.g., `virtual:routes`). The plugin needs this dependency chain to correctly invalidate modules. Also, verify `watch.debounceTime` and `watch.stabilityThreshold` settings are appropriate for your environment.

- **Issue**: Metadata extraction failing or returning `null`.
  - **Solution**: Double-check that the `name` provided to `extract` matches the exported constant/default in your source file. Ensure the `zod` schema accurately reflects the structure of your metadata, including optional properties (`.optional()`) and default values (`.default()`).

## Lifecycle Dependencies

The plugin's lifecycle is tightly integrated with Vite's build and development server hooks:

*   **`configResolved`**: Used to capture Vite's final configuration.
*   **`configureServer` (Dev)**: Initializes internal generators, populates caches, and starts the file watcher. This must complete before HMR can function.
*   **`buildStart` (Build)**: Initializes generators for production, resolves module paths, and emits them as Vite chunks.
*   **`resolveId` & `load`**: Handle requests for virtual modules (`virtual:...`). These need to be active for your application to import the generated data.
*   **`transform`**: Analyzes importer modules to establish dependencies on virtual modules, crucial for fine-grained HMR updates.
*   **`handleHotUpdate`**: Responds to file changes by invalidating relevant modules and triggering HMR updates.
*   **`closeBundle` (Build)**: Generates `sitemap.xml`, `manifest.webmanifest`, and TypeScript types after the main build process is complete.



---
*Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed.*