# Refactoring Checklist for vite-autoload

This checklist outlines actionable steps to address the findings from the code analysis. It is organized by priority and area of impact.

## High Priority (Immediate Impact & Core Refactoring)

- [ ] **Address `module` Property in `ResolvedFile`:**
  - [ ] Refactor `ResolvedFile` to remove the `module` property. This property is an anti-pattern and creates implicit dependencies.
  - [ ] Update all affected files (`src/generators/generator.ts`, `src/utils/resolver.ts`, `src/utils/transform.ts`) to correctly handle module grouping without relying on this property. Consider passing module context explicitly where needed.

- [x] **Eliminate Code Duplication (`generateMd5Hash`):**
  - [x] Remove `src/utils/crypto.ts` entirely.
  - [x] Ensure all usages point to `src/utils/hash.ts`.

- [ ] **Refactor `createAutoloadPlugin` (SRP Violation):**
  - [ ] Break down `createAutoloadPlugin` in `src/plugin/index.ts` into smaller, more focused functions or classes, each responsible for a single aspect of the plugin's lifecycle or functionality (e.g., a `PluginInitializer`, `HookManager`, `ContextBuilder`).
  - [ ] Apply Dependency Inversion Principle (DIP) by injecting dependencies rather than direct instantiation. This will likely involve creating factories or builders for `NameIndex`, `ModuleGenerator`s, and `FileWatcher`.

- [ ] **Refactor `PluginContext` (ISP & SRP Violation):**
  - [ ] Segregate the `PluginContext` interface in `src/plugin/types.ts` into smaller, more specific interfaces (e.g., `BuildTimeContext`, `DevServerContext`, `GeneratorContext`).
  - [ ] Update functions to accept only the specific context interfaces they require, reducing unnecessary dependencies.

## Medium Priority (Performance & Maintainability)

- [ ] **Replace Synchronous File I/O with Asynchronous:**
  - [ ] In `src/generators/manifest-generator.ts`, change `fs.writeFileSync` to `fs.writeFile` (or `fs.promises.writeFile`).
  - [ ] In `src/utils/resolver.ts`, replace `glob.sync` with `glob` (asynchronous version).
  - [ ] In `src/utils/metadata.ts`, replace `fs.readFileSync` with `fs.promises.readFile`.
  - [ ] Update all calling functions to use `await` and handle Promises.

- [ ] **Improve Hashing Algorithm for `getDataHash`:**
  - [ ] Investigate and implement a more robust and consistent hashing algorithm for `getDataHash` in `src/plugin/utils.ts` that guarantees consistent output regardless of key order (e.g., a stable JSON stringify library or a dedicated object hashing library).

- [ ] **Centralize Logging:**
  - [ ] Replace direct `console.warn` usage in `src/utils/transform.ts` with the `logger.warn` method from the `PluginContext`.

- [ ] **Reduce `any` Type Usage:**
  - [ ] Systematically go through the codebase, especially `src/plugin/hmr.ts`, `src/plugin/dependencies.ts`, `src/utils/metadata.ts`, and `src/types/transform.ts`, and replace `any` types with more specific types. This will likely require defining new interfaces or types.

- [ ] **Optimize `updateDependencyMappings`:**
  - [ ] Analyze the call frequency and impact of `updateDependencyMappings` in `src/plugin/dependencies.ts`. If it's a bottleneck, consider incremental updates to the maps instead of full clearing and rebuilding, or explore alternative data structures.

## Low Priority (Code Quality & Future-Proofing)

- [ ] **Review Code Generation Strategy:**
  - [ ] In `src/utils/codegen.ts`, for very large or complex code outputs, consider if string concatenation is still the most efficient method. Explore template engines or dedicated code generation libraries if performance becomes an issue.

- [ ] **Enhance `metadata.ts` Robustness:**
  - [ ] Further refine the AST traversal and evaluation logic in `src/utils/metadata.ts` to handle more complex TypeScript constructs and edge cases gracefully, especially for the `evaluateExpression` function.

- [ ] **Apply Open/Closed Principle to Generators:**
  - [ ] In `src/plugin/build.ts` and `src/plugin/utils.ts`, abstract the sitemap and manifest generation logic behind interfaces. This would allow for new generation methods or formats to be added without modifying existing code.

## General Refactoring Practices

- [ ] **Write Unit Tests:** For critical components and newly refactored modules, ensure adequate unit test coverage to prevent regressions.
- [ ] **Documentation:** Update inline comments and JSDoc where necessary to reflect changes and improve clarity.
- [ ] **Code Formatting & Linting:** Ensure consistent code style across the project using tools like Prettier and ESLint.
- [ ] **Performance Profiling:** After significant refactoring, use profiling tools to identify and address any new performance bottlenecks.
