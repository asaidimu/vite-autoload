# Advanced Usage

This section delves into advanced customization and optimization techniques for `@asaidimu/vite-autoload`.

### Customizing Generators

The plugin provides a flexible generator system that allows you to define custom logic for how virtual modules are generated. This is primarily done through the `GeneratorDefinition` interface, which is used by the plugin internally.

While `createAutoloadPlugin` uses `defaultRoutesGenerator` and `createDefaultModuleGenerator` by default, you can override these or create entirely new generators for specific module groups.

#### `GeneratorDefinition` Interface:

```typescript
interface GeneratorDefinition {
  readonly name: string;
  readonly virtualId?: string;
  readonly dataExtractor: (
    data: any,
    production: boolean,
  ) => Record<string, any[]>;
  readonly codeGenerator: (
    data: Record<string, any[]>,
    production: boolean,
  ) => string;
  readonly moduleResolver: (
    data: Record<string, any[]>,
    production: boolean,
  ) => ResolvedFile[];
  readonly typesExtractor?: (
    data: Record<string, any[]>,
  ) => Record<string, string[]>;
  readonly sitemapExtractor?: (data: Record<string, any[]>) => Array<{
    route: string;
    metadata?: any;
  }>;
}
```

- `name`: A unique identifier for the generator.
- `virtualId`: The virtual module ID (e.g., `virtual:my-custom-data`). Defaults to `virtual:${name}`.
- `dataExtractor`: Transforms the raw data from `createModuleGenerator` (which is based on your `transform` and `aggregate` functions) into a format suitable for your `codeGenerator` and other extractors.
- `codeGenerator`: Takes the extracted data and produces the final JavaScript string content for the virtual module.
- `moduleResolver`: Identifies which `ResolvedFile` entries from the extracted data should be treated as actual modules that Vite needs to emit as chunks.
- `typesExtractor` (Optional): Produces type definitions (e.g., union types) based on the extracted data.
- `sitemapExtractor` (Optional): Generates sitemap entries from the extracted data.

#### Using `createCustomGenerator`

You can extend the default generators using the `createCustomGenerator` helper to apply specific overrides.

```typescript
// In autoload.config.ts or a separate generator file
import { generators } from "@asaidimu/vite-autoload";

const customRoutesGenerator = generators.createCustom(
  generators.routes,
  {
    // Override default dataExtractor to add a global prefix
    dataExtractor: (data, production) => {
      const extracted = generators.routes.dataExtractor(data, production);
      // Example: Add a custom property to all views
      if (extracted.views) {
        extracted.views = extracted.views.map(view => ({ ...view, customFlag: true }));
      }
      return extracted;
    },
    // Override codeGenerator to add custom comments or wrapping
    codeGenerator: (data, production) => {
      const defaultCode = generators.routes.codeGenerator(data, production);
      return `/* Custom generated routes */\n${defaultCode}\n/* End Custom */`;
    }
  }
);

// Then, in your PluginOptions
routes: {
  views: { /* ... */ },
  pages: { /* ... */ },
  generator: customRoutesGenerator // Apply your custom generator
}
```

### Optimization

#### `chunkSize`

For large applications with many routes or modules, setting a `chunkSize` can help manage memory consumption during the data processing phase. The plugin processes files in batches of `chunkSize`.

- **Type**: `number`
- **Default**: `100`

Adjust this value in your `PluginOptions`:

```typescript
createAutoloadConfig({
  extract
}): PluginOptions {
  return {
    // ...
    chunkSize: 50, // Process 50 items at a time
  };
}
```

#### `watch` Options

Fine-tune the file watcher to improve responsiveness and stability, especially in specific development environments or with rapidly changing files.

- `debounceTime`: `number` (Optional, default `1000` ms) - The delay before processing a file change. Increase if too many HMR updates occur.
- `stabilityThreshold`: `number` (Optional, default `300` ms) - The time to wait for write operations to finish. Increase if file changes are processed before complete file writes.

```typescript
createAutoloadConfig({
  extract
}): PluginOptions {
  return {
    // ...
    watch: {
      debounceTime: 1500,
      stabilityThreshold: 500
    }
  };
}
```

#### `logLevel`

Control the verbosity of the plugin's console output. Set to `'debug'` for detailed internal logs when troubleshooting.

- **Type**: `LogLevel` (`'debug'` | `'info'` | `'warn'` | `'error'`)
- **Default**: `'info'`

```typescript
createAutoloadConfig({
  extract
}): PluginOptions {
  return {
    // ...
    logLevel: "debug", // For verbose debugging
  };
}
```

---

### 🤖 AI Agent Guidance

```json
{
  "decisionPoints": [
    "IF default virtual module generation logic is insufficient THEN implement a `GeneratorDefinition` to customize data transformation, code generation, or type extraction.",
    "IF application has a very large number of routes/modules (e.g., >1000) THEN consider reducing `chunkSize` to optimize memory usage.",
    "IF HMR updates are too frequent or unstable in development environment THEN adjust `watch.debounceTime` and `watch.stabilityThreshold`.",
    "IF detailed internal plugin behavior is needed for diagnosis THEN set `logLevel` to `debug`."
  ],
  "verificationSteps": [
    "Check: Custom `GeneratorDefinition` is applied. Expected: Virtual module output (view `virtual:yourModuleName` in browser dev tools or emitted build files) reflects custom `codeGenerator` changes.",
    "Check: Monitor memory usage during development server start and file changes. Expected: `chunkSize` adjustments lead to measurable memory profile changes.",
    "Check: Change a source file rapidly. Expected: HMR updates occur after `debounceTime` has passed, and only once, indicating watcher stability."
  ],
  "quickPatterns": [
    "Pattern: Custom generator setup: `routes: { generator: generators.createCustom(generators.routes, { /* overrides */ }) }`",
    "Pattern: Adjusting chunk size: `chunkSize: 50`",
    "Pattern: Increasing watch stability: `watch: { debounceTime: 2000, stabilityThreshold: 400 }`"
  ],
  "diagnosticPaths": [
    "Error: Custom generator output is incorrect. Symptom: Virtual module content does not match expectations. Check: Verify the logic within `dataExtractor`, `codeGenerator`, `moduleResolver`, and ensure they correctly process the `data` parameter. Fix: Debug generator functions step-by-step or use `console.log` within them.",
    "Error: High memory consumption. Symptom: Dev server becomes slow, crashes due to out-of-memory. Check: Is `chunkSize` too high for your number of files? Are `ignore` patterns effectively filtering unnecessary files? Fix: Reduce `chunkSize`, refine `input.ignore` patterns."
  ]
}
```

---

_Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed._
