import type { ResolvedConfig, ViteDevServer } from "vite";
import { Logger } from "../utils/logger";
import { PluginOptions } from "../types/plugin";
import { ModuleGenerator } from "../generators/generator";
import { NameIndex } from "../utils/name-index";

/**
 * Immutable configuration for the plugin.
 */
export interface PluginConfig {
  readonly options: PluginOptions;
  readonly logger: Logger;
  readonly resolvedConfig: ResolvedConfig;
  readonly nameIndex: NameIndex;
}

/**
 * Mutable runtime state for the plugin, primarily for HMR and dev server interactions.
 */
export interface PluginRuntime {
  server?: ViteDevServer;
  fileToExportMap: Map<
    string,
    { virtualModule: string; exportKey: string; index: number }
  >;
  virtualModuleCache: Map<string, string>;
  importerToVirtualDeps: Map<string, Set<string>>;
  virtualModuleDeps: Map<string, Set<string>>;
}

/**
 * Context for functions that need access to both configuration and runtime state.
 * This will be used sparingly, aiming to pass only necessary parts.
 */
export interface PluginContext {
  config: PluginConfig;
  runtime: PluginRuntime;
  generators: ModuleGenerator[]; // Generators are created once, but their methods are called with runtime context
}
