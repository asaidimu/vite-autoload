import path from "path";
import { normalizePath } from "vite";
import { PluginConfig, PluginRuntime } from "./types";
import { ModuleGenerator } from "../generators/generator";

/**
 * Clears and rebuilds the mappings between source files and virtual modules.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 */
export function updateDependencyMappings(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  const { logger, resolvedConfig, options } = config;
  const { fileToExportMap, virtualModuleDeps } = runtime;

  logger.debug("Starting to update dependency mappings...");
  fileToExportMap.clear();
  virtualModuleDeps.clear();
  importerToVirtualDeps.clear();

  const chunkSize = options.settings.chunkSize || 100;

  const mapEntries = (
    entries: any[],
    virtualModule: string,
    exportKey: string,
  ) => {
    const deps = new Set<string>();
    logger.debug(
      `Mapping entries for virtual module: ${virtualModule}, export key: ${exportKey}`,
    );
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      chunk.forEach((entry: any, index: number) => {
        if (entry?.path) {
          const normalizedPath = normalizePath(entry.path);
          fileToExportMap.set(normalizedPath, {
            virtualModule,
            exportKey,
            index: i + index,
          });
          const absolutePath = path.resolve(
            resolvedConfig.root || process.cwd(),
            entry.path.slice(1),
          );
          deps.add(absolutePath);
          logger.debug(
            `Mapped file: ${normalizedPath} to virtual module: ${virtualModule}`,
          );
        }
      });
    }
    virtualModuleDeps.set(virtualModule, deps);
    logger.debug(
      `Finished mapping entries for virtual module: ${virtualModule}. Total dependencies: ${deps.size}`,
    );
  };

  generators.forEach((generator) => {
    logger.debug(`Processing generator: ${generator.name}`);
    // Note: generator.data is called with production: false as this is for dev server dependency tracking
    const data = generator.data({ production: false });
    for (const [key, entries] of Object.entries(data)) {
      if (Array.isArray(entries)) {
        mapEntries(
          entries,
          `virtual:${generator.name === key ? generator.name : key}`,
          key,
        );
      }
    }
  });

  logger.debug(
    "Finished updating dependency mappings. Total virtual modules with dependencies:",
    Array.from(virtualModuleDeps.keys()),
  );
}

/**
 * Tracks which virtual modules an importer module depends on.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param importerId - The ID of the importing module.
 * @param virtualModuleIds - An array of virtual module IDs that the importer depends on.
 */
export function establishDirectDependencies(
  config: PluginConfig,
  runtime: PluginRuntime,
  importerId: string,
  virtualModuleIds: string[],
) {
  const { logger } = config;
  const { server, importerToVirtualDeps } = runtime;

  if (!server) {
    logger.warn(
      "Skipping direct dependency establishment: Vite server not available.",
    );
    return;
  }

  logger.debug(`Establishing direct dependencies for importer: ${importerId}`);

  if (!importerToVirtualDeps.has(importerId)) {
    importerToVirtualDeps.set(importerId, new Set());
    logger.debug(`Created new dependency set for importer: ${importerId}`);
  }

  const importerVirtualDeps = importerToVirtualDeps.get(importerId)!;
  virtualModuleIds.forEach((virtualId) => {
    importerVirtualDeps.add(virtualId);
    logger.debug(
      `Added virtual module ${virtualId} to importer ${importerId}'s dependencies.`,
    );
  });

  logger.debug(
    `Finished establishing dependencies for ${importerId}. Total virtual modules: ${importerVirtualDeps.size}`,
    Array.from(importerVirtualDeps),
  );
}
