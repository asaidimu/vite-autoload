import type { ResolvedConfig, ViteDevServer } from "vite";
import { Logger } from "../utils/logger";
import { PluginOptions } from "../types";
import { ModuleGenerator } from "../generators/generator";
import { NameIndex } from "../utils/name-index";

// A single context object containing all shared state, passed throughout the plugin.
export interface PluginContext {
  options: PluginOptions;
  logger: Logger;
  config: ResolvedConfig;
  server?: ViteDevServer;
  generators: ModuleGenerator[];
  fileToExportMap: Map<
    string,
    { virtualModule: string; exportKey: string; index: number }
  >;
  virtualModuleCache: Map<string, string>;
  importerToVirtualDeps: Map<string, Set<string>>;
  virtualModuleDeps: Map<string, Set<string>>;
  nameIndex: NameIndex;
}
