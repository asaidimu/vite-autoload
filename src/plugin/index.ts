import type { Plugin, ViteDevServer } from "vite";
import * as path from "path";
import { createModuleGenerator } from "../generators/generator";
import { PluginOptions } from "../types/plugin";
import { createLogger } from "../utils/logger";
import { NameIndex } from "../utils/name-index";
import { generateToDisk } from "../utils/disk-writer";
import { runBuildStart, runCloseBundle, transformHtml } from "./build";
import { PluginConfig, PluginRuntime } from "./types";
import { createViteAdapter } from "./vite-adapter";
import { initializeDevServer } from "./server";
import { getRoot } from "../utils/root";

/**
 * Creates the Vite Autoload plugin.
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

      pluginRuntime = {};

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

    async buildStart() {
      const adapter = createViteAdapter(this);
      await runBuildStart(adapter, pluginConfig, generators);
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
