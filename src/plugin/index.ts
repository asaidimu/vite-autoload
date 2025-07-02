import type { Plugin } from "vite";
import { createModuleGenerator } from "../generators/generator";
import { createFileWatcher } from "../watchers/file-watcher";
import { runBuildStart, runCloseBundle, transformHtml } from "./build";
import { resolveVirtualId, loadVirtualModule } from "./virtual-modules";
import {
  createHmrFileWatcherCallback,
  handleHotUpdate,
  initializeDevServer,
  transformImporterModule,
} from "./hmr";
import { PluginOptions } from "../types";
import { createLogger } from "../utils/logger"; // Import our custom createLogger
import { PluginContext } from "./types";
import { NameIndex } from "../utils/name-index"; // Import NameIndex

export function createAutoloadPlugin(options: PluginOptions): Plugin {
  // Initialize NameIndex
  const nameIndex = new NameIndex(options.components);

  // Shared state is encapsulated in the context object
  const ctx: PluginContext = {
    options,
    // logger will be set in configResolved
    logger: undefined!,
    config: undefined!,
    server: undefined,
    generators: options.components.map((component) => {
      return createModuleGenerator(component);
    }),
    fileToExportMap: new Map(),
    virtualModuleCache: new Map(),
    importerToVirtualDeps: new Map(),
    virtualModuleDeps: new Map(),
    nameIndex, // Add NameIndex to context
  };

  let fileWatcher: ReturnType<typeof createFileWatcher>;

  return {
    name: "vite-plugin-autoload",

    // HOOK: Set up config and server context
    configResolved(resolvedConfig) {
      ctx.config = resolvedConfig;
      // Create our custom logger, passing Vite's logger and our desired logLevel
      ctx.logger = createLogger(resolvedConfig.logger, options.settings.logLevel);
      fileWatcher = createFileWatcher(
        options,
        ctx.logger,
        createHmrFileWatcherCallback(ctx),
      );
    },
    async configureServer(server) {
      ctx.server = server;
      await initializeDevServer(ctx, fileWatcher);
    },

    // HOOK: Handle virtual module resolution and loading
    resolveId(id) {
      return resolveVirtualId(id, ctx);
    },

    async load(id) {
      return await loadVirtualModule(id, ctx);
    },

    // HOOK: Handle build-specific tasks
    async buildStart() {
      await runBuildStart.call(this, ctx);
    },

    buildEnd: () => {
      fileWatcher.stop();
    },

    async closeBundle() {
      await runCloseBundle.call(this, ctx);
    },

    // HOOK: Handle transformations
    transformIndexHtml(html) {
      return transformHtml(html, ctx) as any;
    },

    async transform(code, id) {
      return await transformImporterModule.call(this, code, id, ctx);
    },

    // HOOK: Handle Hot Module Reloading
    handleHotUpdate({ file, server }) {
      ctx.server = server; // Ensure context is up-to-date
      return handleHotUpdate(ctx, file);
    },
  };
}
