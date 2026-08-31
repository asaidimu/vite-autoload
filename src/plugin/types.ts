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
 * Mutable runtime state for the plugin.
 */
export interface PluginRuntime {
  server?: ViteDevServer;
  /** Maps source file paths to their emitted chunk filenames. */
  sourceToChunk?: Map<string, string>;
}

/**
 * Context for functions that need access to both configuration and runtime state.
 */
export interface PluginContext {
  config: PluginConfig;
  runtime: PluginRuntime;
  generators: ModuleGenerator[];
}
