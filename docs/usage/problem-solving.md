# Problem Solving

This section provides guidance on troubleshooting common issues and understanding error conditions when using `@asaidimu/vite-autoload`.

### Troubleshooting & Performance Optimization

1.  **Memory Usage Guidelines**:

    - **Symptom**: Development server is slow, consumes excessive memory, or crashes.
    - **Check**: Are `input.directory` and `input.ignore` precisely configured? Avoid watching large, irrelevant directories (e.g., `node_modules`, extensive test folders). Review your `chunkSize` setting; for applications with thousands of routes/modules, a smaller `chunkSize` (e.g., `50`) can reduce peak memory. For type generation, `export.routeLimit` can prevent overly large type declarations.
    - **Fix**: Refine `input.match` and `input.ignore` patterns. Reduce `chunkSize` in `PluginOptions`. Set `export.routeLimit` for `ApplicationRoute` type.

2.  **File Watching Stability Issues**:

    - **Symptom**: Rapid successive file saves lead to multiple, redundant HMR updates or inconsistent builds. Files might be read before fully written.
    - **Check**: Review `watch.debounceTime` and `watch.stabilityThreshold` in `PluginOptions`. `debounceTime` delays updates, `stabilityThreshold` waits for write operations to finish.
    - **Fix**: Increase `debounceTime` (e.g., `1500ms`) and `stabilityThreshold` (e.g., `500ms`), especially in environments with slow I/O (network drives) or if your editor saves frequently.

3.  **HMR Not Triggering Correctly**:
    - **Symptom**: Changes to source files tracked by the plugin do not trigger an HMR update in the browser, requiring a manual refresh.
    - **Check**: Ensure that the modules (`.ts`, `.tsx`, `.js`) that depend on the virtual modules (e.g., `virtual:routes`) are actually importing them. The plugin relies on Vite's module graph to track importers. Verify `logLevel: 'debug'` to see if files are being added/removed/changed and if HMR updates are being sent.
    - **Fix**: Add explicit `import { views } from 'virtual:routes';` statements in your entry points or modules that consume the generated data. Check your browser's console for HMR messages and Vite's terminal for `[vite-autoload]` HMR logs.

### Error Reference

#### `ZodValidationError`

- **Type**: `z.ZodError` (thrown by `zod` library)
- **Symptoms**: When `metadata` extraction is enabled, the build fails or returns `null` metadata. Console output shows Zod validation errors, detailing mismatched types or missing properties.
- **Properties**: The error object typically has an `errors` array, where each element contains `path` (the location of the validation error) and `message` (description of the error).
- **Scenarios**:
  1.  **Trigger**: Metadata object in source file does not conform to the provided Zod schema.
      **Example**:
      ```typescript
      // file.ts
      export const metadata = { title: 123 }; // Expected string, got number
      // autoload.config.ts
      schema: z.object({ title: z.string() });
      ```
      **Reason**: Type mismatch for `title` property.
  2.  **Trigger**: Required property is missing in the metadata object.
      **Example**:
      ```typescript
      // file.ts
      export const metadata = {}; // Missing required 'title'
      // autoload.config.ts
      schema: z.object({ title: z.string() });
      ```
      **Reason**: Missing `title` property.
- **Diagnosis**: Set `logLevel: 'debug'` to see detailed Zod error messages in the console during metadata extraction. Compare the expected schema with the actual exported metadata object in the source file.
- **Resolution**: Adjust the exported metadata object in your source file to match the `zod` schema, or refine your `zod` schema to accurately reflect the actual data structure (e.g., use `.optional()`, `.default()`).
- **Prevention**: Always use `zod` schemas for metadata validation. Ensure your source files' metadata exports strictly adhere to these schemas.
- **Handling Patterns**: Wrap `extract` calls in `try-catch` blocks if partial metadata is acceptable, or ensure strict schema adherence during development.
  ```typescript
  try {
    const metadata = extract({
      filePath: item.file,
      schema: MySchema,
      name: "metadata",
    });
    // Use metadata
  } catch (error) {
    console.error("Metadata extraction failed for", item.file, error.message);
    // Provide a default or partial metadata object to avoid breaking downstream logic
    metadata = { title: "Untitled", authRequired: false };
  }
  ```
- **Propagation Behavior**: This error is typically caught internally by the plugin's metadata extractor and logged as a warning or error. If not explicitly caught by the `transform` function, it results in the `metadata` property being `null` for that specific item, which can lead to runtime errors in the consuming application if not gracefully handled.

---

### 🤖 AI Agent Guidance

```json
{
  "decisionPoints": [
    "IF application build or dev server is slow THEN check `Troubleshooting & Performance Optimization` section.",
    "IF HMR is not working as expected THEN refer to `HMR Not Triggering Correctly` diagnostic steps.",
    "IF metadata extraction fails or is incorrect THEN consult `Metadata Extraction Errors` and `ZodValidationError` sections."
  ],
  "verificationSteps": [
    "Check: After adjusting `chunkSize` or `watch` options, use system monitoring tools (e.g., `htop`, Task Manager) to observe CPU/memory usage of Vite process. Expected: Improved performance metrics.",
    "Check: After making a code change, confirm that `virtual:module` content updates in browser or build output. Expected: Changes are reflected correctly."
  ],
  "quickPatterns": [
    "Pattern: Configuring a smaller `chunkSize`: `chunkSize: 50`",
    "Pattern: Increasing `debounceTime` for watcher: `watch: { debounceTime: 1500 }`"
  ],
  "diagnosticPaths": [
    "Error `[plugin:vite-plugin-autoload] Failed to extract metadata`. Symptom: Build fails or `metadata` property is `null`. Check: Source file content for `metadata` export, Zod schema definition. Fix: Align metadata object with schema, ensure correct export name ('metadata' vs 'default').",
    "Error `Watcher error`. Symptom: File watching stops, HMR breaks. Check: Console for specific chokidar error details. File permissions or anti-virus interference. Fix: Review `ignored` patterns, check file system permissions, ensure no other process locks files."
  ]
}
```

---

_Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed._
