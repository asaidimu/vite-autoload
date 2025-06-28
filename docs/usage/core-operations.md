# Core Operations

### Essential Plugin Functions

The core functionality of `@asaidimu/vite-autoload` is encapsulated in `createAutoloadPlugin` which takes a comprehensive `PluginOptions` object. This object defines everything from file scanning rules to output generation and custom data transformations.

#### `createAutoloadPlugin(options: PluginOptions): Plugin`
This is the main function to initialize and configure the Vite plugin. It registers all necessary Vite hooks for module resolution, loading, HMR, and build processes.

**Parameters**:
*   `options`: (`PluginOptions`) - An object containing all configuration settings for the plugin.

**Return Value**:
*   A `Vite.Plugin` object ready to be added to the `plugins` array in your `vite.config.ts`.

#### The `PluginOptions` Object

The `PluginOptions` object is the central configuration interface for `@asaidimu/vite-autoload`. It's defined in `src/core/types.ts` and allows granular control over various aspects of the plugin.

```typescript
interface PluginOptions {
  readonly rootDir?: string;
  readonly export?: ExportOptions;
  readonly watch?: WatchOptions;
  readonly sitemap?: SitemapConfig;
  readonly manifest?: ManifestConfig;
  readonly routes: RoutesConfig;
  readonly modules: ModulesConfig;
  readonly logLevel?: LogLevel;
  readonly extract?: ExtractFunction;
  readonly chunkSize?: number;
}
```

Each property configures a specific aspect:

*   `rootDir`: Sets the base directory for resolving relative paths.
*   `export`: Controls the generation of supplementary files like TypeScript declaration files.
*   `watch`: Configures the file watcher behavior, including debounce and stability thresholds.
*   `sitemap`: Defines settings for automatic `sitemap.xml` generation.
*   `manifest`: Specifies options for PWA `manifest.webmanifest` generation.
*   `routes`: Describes how application routes (e.g., pages, views) are discovered, transformed, and exposed.
*   `modules`: Defines configuration for general application modules (e.g., components, utilities, hooks).
*   `logLevel`: Adjusts the verbosity of the plugin's console output.
*   `extract`: A function providing custom logic for extracting metadata from source files.
*   `chunkSize`: Optimizes memory usage by processing routes/modules in batches.

Detailed explanations for each of these configuration sub-objects are provided in the 'Configuration Options' section under 'Usage Documentation'.

### Workflows with Decision Trees

#### Deciding on File Matching and Transformation

When setting up `routes` or `modules`, you need to define how the plugin finds files and what data it extracts from them. This involves `input.directory`, `input.match`, and the `transform` function.

**Goal**: Expose a set of TypeScript files as a virtual module, extracting specific metadata.

1.  **Identify Target Files**: What files do you want to include in this module group? (e.g., all `.ts` files in `src/api`)
2.  **Define Input Configuration**: Set `input.directory` to the base path and `input.match` with appropriate glob patterns.
3.  **Design Output Structure**: What data do you need for each file? (e.g., route, path, metadata, name).
4.  **Implement `transform` Function**: Write the logic to convert the `ResolvedFile` object into your desired data structure. This is where you'll use `extract` for metadata.

#### Example Workflow: Creating a 'Components' Virtual Module

**Scenario**: You have a `src/components` directory with React/Vue components (`.tsx` files), and you want to expose them as a `virtual:components` module, allowing dynamic imports and type-safe access to component names.

**Steps**:
1.  **Configure `modules.components`**: Define `input.directory`, `input.match`, and `input.ignore` (e.g., for test files).
2.  **Define `transform` Logic**: For each component file, extract a `name` and its `path` for dynamic import.
3.  **Implement `aggregate` (Optional)**: If you want to access components by name (e.g., `components.Button`), use `aggregate` to convert the array of component objects into a map.
4.  **Specify Output Types**: Use `output.types` to generate a TypeScript union type for component keys, improving developer experience.

```typescript
// In autoload.config.ts
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
      route: item.path, // Consider 'route' as a unique identifier or path fragment
      path: item.uri // The full URI to load the component
    }),
    aggregate: (items) => items.reduce((acc, item) => ({ ...acc, [item.name!]: item.path }), {})
  }
}

// In your application code (e.g., main.ts)
import { components } from 'virtual:components';

// Dynamically import a component using its name
const MyButton = await import(components.Button);
```

---
### 🤖 AI Agent Guidance

```json
{
  "decisionPoints": [
    "IF a new file group needs to be exposed as a virtual module THEN define a new entry under `PluginOptions.routes` or `PluginOptions.modules`.",
    "IF `transform` function is complex (e.g., custom metadata extraction, dynamic import paths) THEN review `extract` utility documentation.",
    "IF data needs to be restructured from an array to an object/map after transformation THEN implement an `aggregate` function.",
    "IF type safety for keys/routes of generated modules is desired THEN configure `output.types` property."
  ],
  "verificationSteps": [
    "Check: `createAutoloadPlugin` is called with a valid `PluginOptions` object. Expected: No TypeScript compilation errors related to plugin configuration.",
    "Check: Run `bun run dev`. Expected: The virtual module (e.g., `virtual:components`) is accessible and contains the expected data structure.",
    "Check: The `output.types` configuration generates a `.d.ts` file with correct union types. Expected: `src/app/config/autogen.d.ts` exists and contains `export type ComponentKeys = ...`."
  ],
  "quickPatterns": [
    "Pattern: Defining a new module group: `modules: { myModule: { input: { directory: 'path', match: ['glob'] }, transform: (item) => ({ /* ... */ }) } }`",
    "Pattern: Basic `transform` to extract name and path: `transform: (item) => ({ name: item.path.split('/').pop()?.replace(/\\.[^/.]+$/, ''), path: item.uri })`"
  ],
  "diagnosticPaths": [
    "Error: `output.name` property not found. Symptom: Generated virtual module is empty or incorrectly structured. Check: Ensure `output.name` is defined in `TransformConfig.output`. Fix: Add `name: 'yourModuleName'` to `output`."
  ]
}
```

---
*Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed.*