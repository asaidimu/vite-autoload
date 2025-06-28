# Dependency Catalog

## External Dependencies

### vite
- **Purpose**: Core build tool and development server platform that the plugin extends.
  - **Required Interfaces**:
    - `Plugin`: Vite's plugin interface, which the `createAutoloadPlugin` function adheres to, allowing it to integrate into Vite's build lifecycle.
      - **Methods**:
        - `configResolved`
          - **Signature**: `(config: ResolvedConfig) => void`
          - **Parameters**: config: The resolved Vite configuration object.
          - **Returns**: void
        - `configureServer`
          - **Signature**: `(server: ViteDevServer) => Promise<void> | void`
          - **Parameters**: server: The Vite development server instance.
          - **Returns**: void
        - `buildStart`
          - **Signature**: `() => Promise<void> | void`
          - **Parameters**: None.
          - **Returns**: void
        - `resolveId`
          - **Signature**: `(id: string, importer?: string, options?: { isEntry: boolean, custom?: CustomPluginOptions }) => string | null | Promise<string | null>`
          - **Parameters**: id: The module request id. importer: The module that imports this id. options: Resolution options.
          - **Returns**: Resolved module ID or null.
        - `load`
          - **Signature**: `(id: string) => string | null | Promise<string | null>`
          - **Parameters**: id: The resolved module ID.
          - **Returns**: The module's source code as a string or null.
        - `transformIndexHtml`
          - **Signature**: `(html: string) => string | HtmlTagDescriptor[] | Promise<string | HtmlTagDescriptor[]>`
          - **Parameters**: html: The original HTML content.
          - **Returns**: Transformed HTML string or an array of tag descriptors.
        - `transform`
          - **Signature**: `(code: string, id: string, options?: { ssr?: boolean }) => string | { code: string; map?: SourceMapInput } | null | Promise<string | { code: string; map?: SourceMapInput } | null>`
          - **Parameters**: code: The module's source code. id: The module's resolved ID. options: Transform options.
          - **Returns**: Transformed code, optionally with a source map, or null.
        - `handleHotUpdate`
          - **Signature**: `({ file, server, modules, timestamp }: HmrContext) => ModuleNode[] | void | Promise<ModuleNode[] | void>`
          - **Parameters**: HmrContext: Object containing file path, Vite dev server, affected modules, and timestamp.
          - **Returns**: Array of affected module nodes or void.
        - `closeBundle`
          - **Signature**: `() => Promise<void> | void`
          - **Parameters**: None.
          - **Returns**: void
- **Installation**: ``npm install vite` or `bun add vite``
- **Version Compatibility**: `^6.1.0`

### zod
- **Purpose**: Schema declaration and validation library, used for validating extracted metadata.
  - **Required Interfaces**:
    - `ZodType`: The base interface for all Zod schemas, defining methods like `parse` and `safeParse` for data validation.
- **Installation**: ``npm install zod` or `bun add zod``
- **Version Compatibility**: `^3.24.1`

### chokidar
- **Purpose**: Fast and reliable file system watcher, used for detecting changes in source directories to trigger HMR and regeneration.
  - **Required Interfaces**:
    - `FSWatcher`: Chokidar's file system watcher instance, providing methods for watching paths and event listeners for file system events.
      - **Methods**:
        - `watch`
          - **Signature**: `(paths: string | string[], options?: WatchOptions) => FSWatcher`
          - **Parameters**: paths: A single path or array of paths to watch. options: Chokidar watch options.
          - **Returns**: The FSWatcher instance itself.
        - `on`
          - **Signature**: `(event: 'add' | 'change' | 'unlink' | 'error', listener: (...args: any[]) => void) => FSWatcher`
          - **Parameters**: event: The event name ('add', 'change', 'unlink', 'error'). listener: The callback function for the event.
          - **Returns**: The FSWatcher instance itself.
        - `close`
          - **Signature**: `() => Promise<void>`
          - **Parameters**: None.
          - **Returns**: A Promise that resolves when the watcher is closed.
- **Installation**: ``npm install chokidar` or `bun add chokidar``
- **Version Compatibility**: `^3.5.3`

### es-module-lexer
- **Purpose**: A fast ECMAScript module lexer used for static analysis of import/export statements to determine module dependencies for HMR.
  - **Required Interfaces**:
    - `Lexer`: Provides functions to parse ES module syntax.
      - **Methods**:
        - `init`
          - **Signature**: `() => Promise<void>`
          - **Parameters**: None.
          - **Returns**: A Promise that resolves when the lexer is initialized.
        - `parse`
          - **Signature**: `(source: string, filename?: string) => [Import[], Export[], string[]]`
          - **Parameters**: source: The JavaScript/TypeScript source code. filename: Optional filename for error reporting.
          - **Returns**: A tuple containing arrays of imports, exports, and re-exports.
- **Installation**: ``npm install es-module-lexer` or `bun add es-module-lexer``
- **Version Compatibility**: `^1.6.0`

### @babel/parser
- **Purpose**: A JavaScript parser used for converting source code into an Abstract Syntax Tree (AST), enabling deeper static analysis for metadata extraction.
  - **Required Interfaces**:
    - `parse`: Parses JavaScript/TypeScript code into an AST.
      - **Methods**:
        - `parse`
          - **Signature**: `(code: string, options?: ParserOptions) => ParseResult<File>`
          - **Parameters**: code: The source code string. options: Parsing options (e.g., sourceType, plugins).
          - **Returns**: An AST representation of the code.
- **Installation**: ``npm install @babel/parser` or `bun add @babel/parser``
- **Version Compatibility**: `^7.26.5`

### @babel/traverse
- **Purpose**: Enables traversing and manipulating ASTs generated by @babel/parser, essential for precisely locating and extracting metadata nodes.
  - **Required Interfaces**:
    - `traverse`: Walks the AST, calling visitor functions for specific node types.
      - **Methods**:
        - `traverse`
          - **Signature**: `(node: Node, opts: TraverseOptions, scope?: Scope, state?: any, parentPath?: NodePath)`
          - **Parameters**: node: The AST node to start traversal from. opts: Visitor object with functions for node types. scope: The current scope. state: User-defined state. parentPath: The parent node path.
          - **Returns**: void
- **Installation**: ``npm install @babel/traverse` or `bun add @babel/traverse``
- **Version Compatibility**: `^7.26.5`

### playwright
- **Purpose**: A Node.js library for automating Chromium, Firefox and WebKit with a single API. While listed as a dev dependency, its direct purpose in this plugin's current functionality (based on the provided code) is not immediately evident from core logic but suggests potential for browser-based asset analysis or testing utilities in the build process.
- **Installation**: ``npm install playwright` or `bun add playwright``
- **Version Compatibility**: `^1.49.1`

## Peer Dependencies

### typescript
- **Reason**: Required for TypeScript compilation and static AST analysis in the `metadata` extraction utility.
- **Version Requirements**: `~5.7.2`



---
*Generated using Gemini AI on 6/28/2025, 2:57:15 PM. Review and refine as needed.*