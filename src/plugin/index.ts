import type { Plugin } from "vite";
import { createModuleGenerator } from "../generators/generator";
import { PluginOptions } from "../types/plugin";
import { createLogger } from "../utils/logger";
import { NameIndex } from "../utils/name-index";
import { createFileWatcher } from "../watchers/file-watcher";
import { runBuildStart, runCloseBundle, transformHtml } from "./build";
import {
  createHmrFileWatcherCallback,
  handleHotUpdate,
  initializeDevServer,
  transformImporterModule,
} from "./hmr";
import { PluginConfig, PluginRuntime } from "./types";
import { loadVirtualModule, resolveVirtualId } from "./virtual-modules";
import { createViteAdapter } from "./vite-adapter";

/**
 * Creates the Vite Autoload plugin.
 *
 * @param options - The plugin options.
 * @returns A Vite Plugin instance.
 */
export function createAutoloadPlugin(options: PluginOptions): Plugin {
  let pluginConfig: PluginConfig;
  let pluginRuntime: PluginRuntime;
  let fileWatcher: ReturnType<typeof createFileWatcher>;
  let generators: ReturnType<typeof createModuleGenerator>[];

  return {
    name: "vite-plugin-autoload",

    /**
     * Called when the Vite config is resolved.
     * @param resolvedConfig The resolved Vite config.
     */
    configResolved(resolvedConfig) {
      const logger = createLogger(
        resolvedConfig.logger,
        options.settings.logLevel,
      );
      const nameIndex = new NameIndex(options.components);

      /**
       * Immutable configuration for the plugin.
       * @type {PluginConfig}
       */
      pluginConfig = {
        options,
        logger,
        resolvedConfig,
        nameIndex,
      };

      /**
       * Mutable runtime state for the plugin.
       * @type {PluginRuntime}
       */
      pluginRuntime = {
        fileToExportMap: new Map(),
        virtualModuleCache: new Map(),
        importerToVirtualDeps: new Map(),
        virtualModuleDeps: new Map(),
      };

      /**
       * Array of module generators.
       * @type {ReturnType<typeof createModuleGenerator>[]}
       */
      generators = options.components.map((component) => {
        return createModuleGenerator(component, pluginConfig.logger);
      });

      /**
       * File watcher instance.
       * @type {ReturnType<typeof createFileWatcher>}
       */
      fileWatcher = createFileWatcher(
        pluginConfig.options,
        pluginConfig.logger,
        createHmrFileWatcherCallback(pluginConfig, pluginRuntime, generators),
      );
    },
    /**
     * Configures the Vite dev server.
     * @param server The Vite dev server instance.
     */
    async configureServer(server) {
      pluginRuntime.server = server;
      await initializeDevServer(
        pluginConfig,
        pluginRuntime,
        generators,
        fileWatcher,
      );
    },

    /**
     * Resolves the given ID to a virtual module ID if applicable.
     * @param id The ID to resolve.
     * @returns The resolved ID or null.
     */
    resolveId(id) {
      return resolveVirtualId(id, pluginConfig.nameIndex);
    },

    /**
     * Loads the virtual module for the given ID.
     * @param id The ID of the module to load.
     * @returns The module content.
     */
    async load(id) {
      return await loadVirtualModule(
        id,
        pluginConfig.nameIndex,
        pluginConfig.resolvedConfig.isProduction,
        generators,
      );
    },

    /**
     * Called when the build starts.
     */
    async buildStart() {
      const adapter = createViteAdapter(this);
      await runBuildStart(adapter, pluginConfig, generators);
    },

    /**
     * Called when the build ends.
     */
    buildEnd: () => {
      fileWatcher.stop();
    },

    /**
     * Called when the bundle is closed.
     */
    async closeBundle() {
      const adapter = createViteAdapter(this);
      await runCloseBundle(adapter, pluginConfig, pluginRuntime, generators);
    },

    /**
     * Transforms the HTML.
     * @param html The HTML content.
     * @returns The transformed HTML.
     */
    transformIndexHtml(html) {
      return transformHtml(html, pluginConfig) as any;
    },

    /**
     * Transforms the given code.
     * @param code The code to transform.
     * @param id The ID of the module.
     * @returns The transformed code.
     */
    async transform(code, id) {
      const adapter = createViteAdapter(this);
      return await transformImporterModule(
        adapter,
        code,
        id,
        pluginConfig,
        pluginRuntime,
        generators,
      );
    },

    /**
     * Handles hot module updates.
     * @param file The file that was updated.
     * @returns Modules to be hot reloaded.
     */
    handleHotUpdate({ file }) {
      return handleHotUpdate(pluginConfig, pluginRuntime, file);
    },
  };
}
