import path from "path";
import { normalizePath } from "vite";
import { PluginContext } from "./types";

/**
 * Clears and rebuilds the mappings between source files and virtual modules.
 */
export function updateDependencyMappings(ctx: PluginContext) {
  const { logger } = ctx;
  logger.debug("Starting to update dependency mappings...");
  ctx.fileToExportMap.clear();
  ctx.virtualModuleDeps.clear();

  const { config, fileToExportMap, virtualModuleDeps, generators } = ctx;
  const chunkSize = ctx.options.settings.chunkSize || 100;

  const mapEntries = (
    entries: any[],
    virtualModule: string,
    exportKey: string,
  ) => {
    const deps = new Set<string>();
    logger.debug(`Mapping entries for virtual module: ${virtualModule}, export key: ${exportKey}`);
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
            config.root || process.cwd(),
            entry.path.slice(1),
          );
          deps.add(absolutePath);
          logger.debug(`Mapped file: ${normalizedPath} to virtual module: ${virtualModule}`);
        }
      });
    }
    virtualModuleDeps.set(virtualModule, deps);
    logger.debug(`Finished mapping entries for virtual module: ${virtualModule}. Total dependencies: ${deps.size}`);
  };

  generators.forEach((generator) => {
    logger.debug(`Processing generator: ${generator.name}`);
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
 */
export function establishDirectDependencies(
  ctx: PluginContext,
  importerId: string,
  virtualModuleIds: string[],
) {
  const { logger } = ctx;
  if (!ctx.server) {
    logger.warn("Skipping direct dependency establishment: Vite server not available.");
    return;
  }

  logger.debug(`Establishing direct dependencies for importer: ${importerId}`);

  if (!ctx.importerToVirtualDeps.has(importerId)) {
    ctx.importerToVirtualDeps.set(importerId, new Set());
    logger.debug(`Created new dependency set for importer: ${importerId}`);
  }

  const importerVirtualDeps = ctx.importerToVirtualDeps.get(importerId)!;
  virtualModuleIds.forEach((virtualId) => {
    importerVirtualDeps.add(virtualId);
    logger.debug(`Added virtual module ${virtualId} to importer ${importerId}'s dependencies.`);
  });

  logger.debug(
    `Finished establishing dependencies for ${importerId}. Total virtual modules: ${importerVirtualDeps.size}`,
    Array.from(importerVirtualDeps),
  );
}
