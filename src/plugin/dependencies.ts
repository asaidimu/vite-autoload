import path from "path";
import { normalizePath } from "vite";
import { PluginContext } from "./types";

/**
 * Clears and rebuilds the mappings between source files and virtual modules.
 */
export function updateDependencyMappings(ctx: PluginContext) {
  ctx.logger.debug("Updating dependency mappings");
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
        }
      });
    }
    virtualModuleDeps.set(virtualModule, deps);
  };

  generators.forEach((generator) => {
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

  ctx.logger.debug(
    "Updated virtual module dependencies:",
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
  if (!ctx.server) return;

  if (!ctx.importerToVirtualDeps.has(importerId)) {
    ctx.importerToVirtualDeps.set(importerId, new Set());
  }

  const importerVirtualDeps = ctx.importerToVirtualDeps.get(importerId)!;
  virtualModuleIds.forEach((virtualId) => {
    importerVirtualDeps.add(virtualId);
  });

  ctx.logger.debug(
    `Established dependencies for ${importerId}:`,
    Array.from(importerVirtualDeps),
  );
}
