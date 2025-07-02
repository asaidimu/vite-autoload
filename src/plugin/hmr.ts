import path from "path";
import { normalizePath } from "vite";
import { PluginContext } from "./types";
import { hasVirtualModuleChanged, regenerateTypes, getDataHash } from "./utils";
import {
  updateDependencyMappings,
  establishDirectDependencies,
} from "./dependencies";
import { init, parse as parseImports } from "es-module-lexer";
import { isJavaScriptLikeModule } from "../utils/checkers";

/**
 * The file watcher callback that triggers HMR.
 */
export function createHmrFileWatcherCallback(ctx: PluginContext) {
  return async (changedFiles: string[]) => {
    ctx.logger.debug(`Files changed: ${changedFiles.join(", ")}`);
    await handleVirtualModuleStructureChange(ctx);
  };
}

/**
 * Initializes the dev server by caching data, setting up dependencies, and starting the file watcher.
 */
export async function initializeDevServer(
  ctx: PluginContext,
  fileWatcher: any,
) {
  const { server, generators, virtualModuleCache } = ctx;

  for (const generator of generators) {
    const data = await generator.data({ production: false });
    for (const name of Object.keys(data)) {
      virtualModuleCache.set(name, getDataHash(data[name]));
    }
  }

  updateDependencyMappings(ctx);

  fileWatcher.start();
  server?.watcher.on("close", () => fileWatcher.stop());
}

/**
 * Handles HMR for changes *within* a file that is part of a virtual module.
 */
export function handleHotUpdate(ctx: PluginContext, file: string) {
  const { logger, server, fileToExportMap, importerToVirtualDeps } = ctx;
  if (!server) return;

  const normalizedFile = normalizePath(path.resolve(file));
  const mapping = fileToExportMap.get(normalizedFile);

  if (!mapping) {
    logger.debug(`File ${normalizedFile} is not tracked by any virtual module`);
    return;
  }

  logger.debug(
    `File ${normalizedFile} is tracked by virtual module: ${mapping.virtualModule}`,
  );

  const affectedModules = new Set<any>();
  for (const [importerId, virtualDeps] of importerToVirtualDeps.entries()) {
    if (virtualDeps.has(mapping.virtualModule)) {
      const importerModule = server.moduleGraph.getModuleById(importerId);
      if (importerModule) {
        logger.debug(`Adding affected importer: ${importerId}`);
        server.moduleGraph.invalidateModule(importerModule);
        affectedModules.add(importerModule);

        importerModule.importers.forEach((parent) => {
          server.moduleGraph.invalidateModule(parent);
          affectedModules.add(parent);
        });
      }
    }
  }

  if (affectedModules.size > 0) {
    logger.info(
      `HMR: File ${path.basename(file)} changed, updating ${affectedModules.size} importer modules`,
    );
    server.hot.send({
      type: "update",
      updates: Array.from(affectedModules).map((mod: any) => ({
        type: "js-update",
        timestamp: Date.now(),
        path: mod.id || mod.file,
        acceptedPath: mod.id || mod.file,
      })),
    });
    return [];
  }
}

/**
 * Transforms importer modules to establish dependencies for HMR.
 */
export async function transformImporterModule(
  this: any,
  code: string,
  id: string,
  ctx: PluginContext,
): Promise<{ code: string; map: null } | null> {
  if (
    id.startsWith("\0") ||
    !ctx.server ||
    ctx.config.command !== "serve" ||
    !isJavaScriptLikeModule(id)
  ) {
    return null;
  }

  try {
    await init;
    const [imports] = parseImports(code);

    const virtualModuleIds = ctx.generators
      .flatMap((g) => Object.keys(g.data({ production: false })))
      .map((key) => `virtual:${key}`);

    const importedVirtualIds = imports
      .map((imp) => imp.n)
      .filter((name) => name && virtualModuleIds.includes(name)) as string[];

    if (importedVirtualIds.length > 0) {
      establishDirectDependencies(ctx, id, importedVirtualIds);
      const hmrInjector = getHmrCodeInjector(ctx).bind(this);
      const result = hmrInjector(id, importedVirtualIds);
      return result ? { code: code + result.code, map: null } : null;
    }
  } catch (error) {
    ctx.logger.error(`Failed to transform ${id}:`, error);
  }

  return null;
}

// --- Internal Functions ---

/**
 * Handles HMR for virtual module *structure* changes (e.g., adding/deleting a file).
 */
async function handleVirtualModuleStructureChange(ctx: PluginContext) {
  if (!ctx.server && !ctx.config.isProduction) return;

  const changedVirtualModules = new Set<string>();

  for (const generator of ctx.generators) {
    const data = await generator.data({ production: false });
    for (const moduleName of Object.keys(data)) {
      if (await hasVirtualModuleChanged(ctx, moduleName)) {
        changedVirtualModules.add(`virtual:${moduleName}`);
      }
    }
  }

  updateDependencyMappings(ctx);

  if (changedVirtualModules.size > 0 && ctx.server) {
    const { moduleGraph, hot } = ctx.server;
    for (const moduleName of changedVirtualModules) {
      const mod = moduleGraph.getModuleById(`\0${moduleName}`);
      if (mod) {
        moduleGraph.invalidateModule(mod);
        const affected = new Set(mod.importers);
        affected.add(mod);

        if (affected.size > 0) {
          ctx.logger.info(
            `Sending HMR update for ${moduleName} structure change (affecting ${affected.size} modules)`,
          );
          hot.send({
            type: "update",
            updates: Array.from(affected).map((m: any) => ({
              type: "js-update",
              timestamp: Date.now(),
              path: m.id || m.file,
              acceptedPath: m.id || m.file,
            })),
          });
        }
      }
    }
    await regenerateTypes(ctx);
  }
}

/**
 * Injects HMR boilerplate into modules that import virtual modules.
 */
function getHmrCodeInjector(ctx: PluginContext) {
  return (
    id: string,
    importedVirtualIds: string[],
  ): { code: string; map: null } | null => {
    ctx.logger.debug(
      `Module ${id} imports virtual modules:`,
      importedVirtualIds,
    );

    importedVirtualIds.forEach((virtualId) => {
      const fileDeps = ctx.virtualModuleDeps.get(virtualId);
      if (fileDeps) {
        fileDeps.forEach((filePath) => {
          /* @ts-ignore */
          (this as any).addWatchFile(filePath);
          ctx.logger.debug(`Added watch file: ${filePath} for importer: ${id}`);
        });
      }
    });

    const hmrCode = `
// vite-plugin-autoload: HMR handling
if (import.meta.hot) {
  import.meta.hot.accept(() => {});
}`;
    return { code: hmrCode, map: null };
  };
}
