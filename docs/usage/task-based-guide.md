# Task-Based Guide

This guide covers common tasks you'll perform with `@asaidimu/vite-autoload`.

### 1. Configuring Routes & Modules

**Goal**: Define how your application's routes (pages) and reusable modules (components, hooks) are discovered and made available programmatically.

**Steps**:

1.  **Identify Directories**: Determine the base directories where your pages, views, or components reside (e.g., `src/pages`, `src/components`).
2.  **Define Match Patterns**: Use glob patterns (`*.tsx`, `**/index.ts`) to specify which files within those directories should be included. Use `ignore` for exclusions (e.g., `**/__tests__/**`).
3.  **Choose Prefix (Optional)**: If you want to group `uri` paths under a common prefix in the generated output (e.g., `/pages/`), set the `prefix` in `input`.
4.  **Implement `transform` Logic**: This is crucial. For each matched file, convert it into a structured object containing relevant information like a unique `route` identifier, the `path` for dynamic import, and any `metadata`.

**Example: Pages Configuration**

```typescript
// autoload.config.ts
routes: {
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
  }
}
```

### 2. Extracting Metadata from Source Files

**Goal**: Augment your route/module data with structured information directly embedded in the source files, like a page title or API endpoint configuration.

**Method**: Use the `extract` function within your `transform` logic.

**Steps**:

1.  **Define Metadata in Source File**: In your `.ts`/`.tsx` file, export a constant or default object containing your metadata.

    ```typescript
    // src/interface/pages/home.tsx
    export const metadata = {
      title: "Home Page",
      description: "Welcome to our site!",
      authRequired: false,
    };

    // ... rest of your component code
    ```

2.  **Define Zod Schema**: Create a `zod` schema that validates the structure of your metadata.

    ```typescript
    // In your autoload.config.ts transform function
    import { z } from "zod";
    // ...
    const PageMetadataSchema = z.object({
      title: z.string(),
      description: z.string().optional(),
      authRequired: z.boolean().optional().default(false),
    });
    ```

3.  **Call `extract` in `transform`**: Pass the file path, schema, and the exported name of your metadata constant (or `'default'` for default exports).

    ```typescript
    transform: (page) => {
      // ... route logic
      return {
        route: route || "/",
        path: page.uri,
        metadata: extract({
          filePath: page.file,
          schema: PageMetadataSchema,
          name: "metadata", // The name of the exported constant
        }),
      };
    },
    ```

### 3. Generating Sitemap & Manifest

**Goal**: Automatically create `sitemap.xml` for SEO and `manifest.webmanifest` for Progressive Web App features during the build process.

**Method**: Configure the `sitemap` and `manifest` properties in your `PluginOptions`.

**Steps**:

1.  **Configure `sitemap`**: Specify the `output` filename, `baseUrl` (critical for absolute URLs), and optional `exclude` patterns.
    - The `route` property from your transformed `routes` data will be used to generate sitemap entries.
    - `metadata` properties like `changefreq` and `priority` from your transformed route objects will be respected if present (e.g., `metadata: { changefreq: 'daily', priority: 0.9 }`).
2.  **Configure `manifest`**: Provide details for your PWA, including `name`, `shortName`, `description`, `theme_color`, `background_color`, `display`, `start_url`, and `icons`.

**Example Configuration**:

```typescript
// autoload.config.ts
export: { /* ... */ },
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
routes: { /* ... */ },
// ...
```

### 4. Consuming Generated Modules in Your Application

**Goal**: Access the data generated by the plugin in your client-side or server-side rendering code.

**Method**: Import virtual modules using their `virtual:` prefix.

**Steps**:

1.  **Import**: Use a standard `import` statement with the virtual module ID (e.g., `virtual:routes`, `virtual:components`).
2.  **Access Data**: The imported object will contain the processed data as defined by your `output.name` and `transform`/`aggregate` functions.

**Example Usage**:

```typescript
// ui/main.ts or a router file
import { views, pages } from "virtual:routes";
import { components } from "virtual:components";

console.log("All views:", views);
// Example: Dynamically import a view based on a route parameter
async function loadView(routeName: string) {
  const view = views.find((v) => v.route === routeName);
  if (view) {
    const module = await import(view.path); // 'path' contains the dynamic import URI
    console.log(`Loaded view: ${routeName}`, module);
    return module;
  }
  return null;
}

// Access aggregated components (if aggregate function used)
console.log("All components (map):", components);

// Example: Dynamically import a specific component
async function loadComponent(componentName: string) {
  const componentPath = components[componentName];
  if (componentPath) {
    const module = await import(componentPath);
    console.log(`Loaded component: ${componentName}`, module);
    return module;
  }
  return null;
}

// Call example
loadView("/counter");
loadComponent("Button");
```

---

### 🤖 AI Agent Guidance

```json
{
  "decisionPoints": [
    "IF you need to include or exclude specific files from processing THEN adjust `input.match` and `input.ignore`.",
    "IF the structure of the generated data needs to change THEN modify the `transform` function.",
    "IF you need to validate extracted metadata THEN ensure a Zod `schema` is provided to `extract`.",
    "IF your PWA requires specific icons or display modes THEN consult `ManifestConfig` for options.",
    "IF your application requires SEO THEN ensure `sitemap` is enabled and `baseUrl` is correct."
  ],
  "verificationSteps": [
    "Check: After `bun run dev`, inspect your browser's developer console for `console.log` output from imported virtual modules. Expected: Data matches your `transform` logic.",
    "Check: After `bun run build`, inspect your `dist` directory. Expected: `sitemap.xml` and `manifest.webmanifest` files are present and correctly formatted.",
    "Check: In development, modify a file tracked by the plugin. Expected: HMR updates the relevant parts of your application without a full page reload."
  ],
  "quickPatterns": [
    "Pattern: Adding metadata to a route: `metadata: extract({ filePath: item.file, schema: z.object({ title: z.string() }), name: 'metadata' })`",
    "Pattern: Basic import of virtual module: `import { yourModuleName } from 'virtual:yourModuleName';`"
  ],
  "diagnosticPaths": [
    "Error: `sitemap.xml` or `manifest.webmanifest` not generated. Symptom: Files missing in `dist` folder after build. Check: Ensure `sitemap` and `manifest` options are correctly configured in `autoload.config.ts` and `config.isProduction` is true during build. Fix: Verify configuration, run `bun run build`.",
    "Error: Metadata extraction returns `null` or `undefined`. Symptom: Transformed object's `metadata` property is empty. Check: `filePath` is correct, `name` matches the exported constant/default, `schema` accurately reflects the data shape in the source file. Fix: Review source file exports and Zod schema."
  ]
}
```

---

_Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed._
