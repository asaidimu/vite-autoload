import type { Plugin, ViteDevServer } from "vite";
import * as path from "path";
import { createModuleGenerator } from "../generators/generator";
import { PluginOptions } from "../types/plugin";
import { createLogger } from "../utils/logger";
import { NameIndex } from "../utils/name-index";
import { runBuildStart, runCloseBundle, transformHtml } from "./build";
import { PluginConfig, PluginRuntime } from "./types";
import {
  loadVirtualModule,
  resolveVirtualId,
  loadAliasModule,
} from "./virtual-modules";
import { createViteAdapter } from "./vite-adapter";
import { initializeDevServer } from "./server";
import { getRoot } from "../utils/root";

/**
 * Computes the absolute output directory for generated modules.
 */
function getOutputDir(config: PluginConfig): string {
  const rootDir =
    config.options.settings.rootDir ||
    config.resolvedConfig?.root ||
    process.cwd();
  return path.resolve(rootDir, config.options.settings.outputDir || "src/generated");
}

/**
 * Creates the Vite Autoload plugin.
 *
 * Hybrid mode:
 * - Dev: disk-based generated files (reliable HMR)
 * - Production: virtual modules with emitFile (correct chunk resolution)
 *   - Intercepts configured alias (e.g. `@generated/*`) imports
 *   - Returns virtual module code that imports from emitted chunks
 */
export function createAutoloadPlugin(options: PluginOptions): Plugin {
  let pluginConfig: PluginConfig;
  let pluginRuntime: PluginRuntime;
  let generators: ReturnType<typeof createModuleGenerator>[];

  return {
    name: "vite-plugin-autoload",

    configResolved(resolvedConfig) {
      const logger = createLogger(
        resolvedConfig.logger,
        options.settings.logLevel,
      );
      const nameIndex = new NameIndex(options.components);

      const root = getRoot(options, resolvedConfig);
      options.settings.rootDir = root;
      pluginConfig = {
        options,
        logger,
        resolvedConfig,
        nameIndex,
      };

      pluginRuntime = {
        sourceToChunk: new Map(),
      };

      generators = options.components.map((component) =>
        createModuleGenerator(component, pluginConfig.logger),
      );
    },

    configureServer(server: ViteDevServer) {
      pluginRuntime.server = server;

      initializeDevServer(pluginConfig, pluginRuntime, generators).catch(
        (err) => {
          pluginConfig.logger.error("Failed to initialize dev server:", err);
        },
      );
    },

    resolveId(id) {
      if (!pluginConfig.resolvedConfig.isProduction) {
        return null;
      }

      // In production, intercept the @generated alias so we can serve
      // virtual modules with correct chunk imports instead of disk files.
      const alias = pluginConfig.options.settings.alias;
      if (alias && (id.startsWith(alias + "/") || id === alias)) {
        const name = id.slice(alias.length + 1);
        if (name && pluginConfig.nameIndex.lookup(name)) {
          return `\0virtual:${name}`;
        }
      }

      // Also handle virtual:* imports
      return resolveVirtualId(id, pluginConfig.nameIndex);
    },

    async load(id) {
      if (!pluginConfig.resolvedConfig.isProduction) {
        return null;
      }

      // Handle \0virtual: modules (from resolveId)
      if (id.startsWith("\0virtual:")) {
        if (pluginRuntime.sourceToChunk?.size) {
          return await loadAliasModule(
            id,
            pluginConfig.nameIndex,
            pluginConfig.resolvedConfig.isProduction,
            generators,
            pluginRuntime.sourceToChunk,
          );
        }
        return await loadVirtualModule(
          id,
          pluginConfig.nameIndex,
          pluginConfig.resolvedConfig.isProduction,
          generators,
        );
      }

      // Fallback: intercept resolved disk paths inside outputDir
      // (for when Rolldown resolves aliases before calling resolveId)
      const outputDir = getOutputDir(pluginConfig);
      if (id.startsWith(outputDir) && (id.endsWith(".ts") || id.endsWith(".js"))) {
        const basename = id.split("/").pop()!.replace(/\.(ts|js)$/, "");
        const found = pluginConfig.nameIndex.lookup(basename);
        if (found) {
          if (pluginRuntime.sourceToChunk?.size) {
            return await loadAliasModule(
              `\0virtual:${basename}`,
              pluginConfig.nameIndex,
              pluginConfig.resolvedConfig.isProduction,
              generators,
              pluginRuntime.sourceToChunk,
            );
          }
          return await loadVirtualModule(
            `\0virtual:${basename}`,
            pluginConfig.nameIndex,
            pluginConfig.resolvedConfig.isProduction,
            generators,
          );
        }
      }

      return null;
    },

    async buildStart() {
      const adapter = createViteAdapter(this);
      await runBuildStart(adapter, pluginConfig, pluginRuntime, generators);
    },

    buildEnd() {},

    async closeBundle() {
      const adapter = createViteAdapter(this);
      await runCloseBundle(adapter, pluginConfig, pluginRuntime, generators);
    },

    transformIndexHtml(html) {
      return transformHtml(html, pluginConfig) as any;
    },
  };
}
