# Getting Started

### Overview

`@asaidimu/vite-autoload` simplifies web development by automating file discovery, module bundling, and static asset generation within Vite projects. It transforms your filesystem structure into importable JavaScript modules, enhancing type safety and developer experience. The plugin is highly configurable, allowing you to define custom logic for how files are processed, how their metadata is extracted, and how they are exposed in your application.

### Core Concepts

- **Virtual Modules**: The plugin creates 'virtual' modules (e.g., `virtual:routes`, `virtual:components`) that can be imported directly in your application code. These modules contain data derived from files on your filesystem.
- **File Matching and Transformation**: You define patterns to match files in specific directories. For each matched file, a `transform` function can convert it into a custom data structure (e.g., a route object with metadata).
- **Metadata Extraction**: Leveraging TypeScript's Abstract Syntax Tree (AST) and Zod schemas, the plugin can statically analyze your source files to extract structured metadata (like page titles, authentication requirements) and include it in your generated modules.
- **Automatic Generation**: Beyond module data, the plugin automates the generation of `sitemap.xml` for SEO and `manifest.webmanifest` for PWA capabilities, streamlining deployment.

### Quick Setup Guide

1.  **Prerequisites**: Ensure you have Node.js (LTS, v18+), Vite (v6.0.0+), and a package manager (Bun recommended, or npm/yarn/pnpm) installed.

2.  **Installation**: Install the plugin and its peer dependencies:

    ```bash
    bun add @asaidimu/vite-autoload
    bun add @babel/parser @babel/traverse playwright zod --development
    ```

3.  **Vite Configuration (`vite.config.ts`)**: Update your Vite configuration to include the plugin. You'll typically create a separate configuration file for `vite-autoload`.

    ```typescript
    // vite.config.ts
    import { defineConfig } from "vite";
    import { createAutoloadPlugin, extract } from "@asaidimu/vite-autoload";
    import createAutoloadConfig from "./autoload.config"; // Your custom autoload config file

    export default defineConfig({
      plugins: [createAutoloadPlugin(createAutoloadConfig({ extract }))],
    });
    ```

4.  **Autoload Configuration (`autoload.config.ts`)**: Create this file in your project root to define how modules and routes are discovered and processed.

    ```typescript
    // autoload.config.ts (example content)
    import { z } from "zod";
    import type {
      ExtractFunction,
      PluginOptions,
    } from "@asaidimu/vite-autoload";

    interface ConfigOptions {
      readonly extract: ExtractFunction;
    }

    export default function createAutoloadConfig({
      extract,
    }: ConfigOptions): PluginOptions {
      return {
        rootDir: process.cwd(),
        export: {
          types: "src/app/config/autogen.d.ts",
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
              types: { name: "ViewKeys", key: "route" },
            },
            transform: (view) => {
              const route = view.path
                .replace(/.*ui/, "")
                .replace(/\\/g, "/")
                .replace(/\.tsx?$/, "")
                .replace(/index.?$/, "");

              return {
                route:
                  route.length === 1
                    ? route
                    : route.replace(new RegExp("/$"), ""),
                path: view.uri,
                module: route.split("/")[0],
                metadata: extract({
                  filePath: view.file,
                  schema: z.object({
                    title: z.string(),
                    description: z.string().optional(),
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
                  schema: z.object({
                    title: z.string(),
                    authRequired: z.boolean().optional(),
                  }),
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
              prefix: "/components/",
            },
            output: {
              name: "components",
              template:
                "export const components = {{ data }};\nexport default components;",
              types: { name: "ComponentKeys", key: "name" },
            },
            transform: (item) => ({
              name: item.path
                .split("/")
                .pop()
                ?.replace(/\.tsx?$/, ""),
              route: item.path,
              path: item.uri,
            }),
            aggregate: (items) =>
              items.reduce(
                (acc, item) => ({ ...acc, [item.name!]: item.path }),
                {},
              ),
          },
          hooks: {
            input: { directory: "src/hooks", match: ["*.ts"] },
            output: { name: "hooks" },
            transform: (item) => ({
              name: item.path.split("/").pop()?.replace(/\.ts$/, ""),
              path: item.uri,
            }),
          },
        },
        logLevel: "info",
        chunkSize: 100,
        watch: {
          debounceTime: 1000,
          stabilityThreshold: 300,
        },
      };
    }
    ```

5.  **Run Development Server**: Start your Vite development server.

    ```bash
    bun run dev
    ```

    You should observe `[vite-autoload]` log messages in your console. During a production build (`bun run build`), `sitemap.xml` and `manifest.webmanifest` will be generated.

---

### 🤖 AI Agent Guidance

```json
{
  "decisionPoints": [
    "IF user wants to start a new project THEN follow 'Quick Setup Guide' ELSE refer to 'Installation Steps' for existing projects.",
    "IF Vite is not installed THEN install Vite globally or locally as per Vite documentation.",
    "IF using a package manager other than Bun THEN adjust `bun add` commands to `npm install` or `yarn add`."
  ],
  "verificationSteps": [
    "Check: `bun add @asaidimu/vite-autoload` completes successfully. Expected: No errors, package listed in `package.json`.",
    "Check: `bun add @babel/parser @babel/traverse playwright zod --development` completes successfully. Expected: Development dependencies listed in `package.json`.",
    "Check: `vite.config.ts` imports `createAutoloadPlugin` and `createAutoloadConfig`. Expected: No import errors.",
    "Check: `autoload.config.ts` exports a function returning `PluginOptions`. Expected: Valid TypeScript syntax, no type errors.",
    "Check: Run `bun run dev`. Expected: `[vite-autoload]` logs in console (`File watcher started`, `Initialized X routes`).",
    "Check: Make a change to a watched file (e.g., `ui/main.ts`). Expected: HMR update in browser and `[vite-autoload]` debug logs for file changes."
  ],
  "quickPatterns": [
    "Pattern: `// vite.config.ts\nimport { defineConfig } from \"vite\";\nimport { createAutoloadPlugin, extract } from \"@asaidimu/vite-autoload\";\nimport createAutoloadConfig from \"./autoload.config\";\n\nexport default defineConfig({\n  plugins: [\n    createAutoloadPlugin(createAutoloadConfig({ extract }))\n  ],\n});`",
    "Pattern: `// autoload.config.ts\nimport { z } from \"zod\";\nimport type { ExtractFunction, PluginOptions } from \"@asaidimu/vite-autoload\";\n\nexport default function createAutoloadConfig({ extract }: ConfigOptions): PluginOptions {\n  return { /* ... your plugin options ... */ };\n}`"
  ],
  "diagnosticPaths": [
    "Error: Plugin not found. Symptom: Vite fails to start with `[plugin:vite-plugin-autoload] Failed to resolve plugin`. Check: Ensure `@asaidimu/vite-autoload` is installed and correctly imported in `vite.config.ts`. Fix: Verify `package.json` and `node_modules`, correct import paths.",
    "Error: Missing development dependencies. Symptom: TypeScript errors related to `@babel/parser`, `zod`. Check: Run `bun add @babel/parser @babel/traverse playwright zod --development`. Fix: Install required peer dependencies."
  ]
}
```

---

_Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed._
