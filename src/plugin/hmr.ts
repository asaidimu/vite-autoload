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
  const { server, generators, virtualModuleCache, logger } = ctx;

  logger.info("Initializing dev server...");

  for (const generator of generators) {
    logger.debug(`Processing generator: ${generator.name}`);
    const data = await generator.data({ production: false });
    for (const name of Object.keys(data)) {
      const dataHash = await getDataHash(data[name]);
      virtualModuleCache.set(name, dataHash);
      logger.debug(`Cached virtual module: ${name} with hash: ${dataHash}`);
    }
  }

  logger.debug("Updating dependency mappings...");
  updateDependencyMappings(ctx);

  logger.info("Starting file watcher...");
  fileWatcher.start();
  server?.watcher.on("close", () => {
    logger.info("Dev server closed. Stopping file watcher.");
    fileWatcher.stop();
  });
  logger.info("Dev server initialized.");
}

/**
 * Handles HMR for changes *within* a file that is part of a virtual module.
 */
export function handleHotUpdate(ctx: PluginContext, file: string) {
  const { logger, server, fileToExportMap, importerToVirtualDeps } = ctx;
  if (!server) {
    logger.warn("HMR: Vite server not available.");
    return;
  }

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
          logger.debug(`Invalidating parent module: ${parent.id}`);
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
    logger.debug("HMR update sent.");
    return [];
  } else {
    logger.debug("No affected modules found for HMR update.");
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
  ctx.logger.debug(`transformImporterModule called for id: ${id}`);
  if (
    id.startsWith("\0") ||
    !ctx.server ||
    ctx.config.command !== "serve" ||
    !isJavaScriptLikeModule(id)
  ) {
    ctx.logger.debug(`Skipping transformation for ${id} due to filter conditions.`);
    return null;
  }

  try {
    await init;
    const [imports] = parseImports(code);
    ctx.logger.debug(`Parsed imports for ${id}:`, imports);

    const virtualModuleIds = ctx.generators
      .flatMap((g) => Object.keys(g.data({ production: false })))
      .map((key) => `virtual:${key}`);
    ctx.logger.debug(`Expected virtual module IDs:`, virtualModuleIds);

    const importedVirtualIds = imports
      .map((imp) => imp.n)
      .filter((name) => name && virtualModuleIds.includes(name)) as string[];
    ctx.logger.debug(`Found imported virtual IDs for ${id}:`, importedVirtualIds);

    if (importedVirtualIds.length > 0) {
      ctx.logger.debug(`Establishing direct dependencies for ${id} with virtual modules:`, importedVirtualIds);
      establishDirectDependencies(ctx, id, importedVirtualIds);
      const hmrInjector = getHmrCodeInjector(ctx).bind(this);
      const result = hmrInjector(id, importedVirtualIds);
      ctx.logger.debug(`HMR injector result for ${id}:`, result);
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
  const { server, config, generators, logger } = ctx;
  if (!server && !config.isProduction) {
    logger.debug("Skipping virtual module structure change handling: server not available and not in production.");
    return;
  }

  logger.info("Handling virtual module structure change...");
  const changedVirtualModules = new Set<string>();

  for (const generator of generators) {
    logger.debug(`Checking generator: ${generator.name} for changes.`);
    const data = await generator.data({ production: false });
    for (const moduleName of Object.keys(data)) {
      if (await hasVirtualModuleChanged(ctx, moduleName)) {
        changedVirtualModules.add(`virtual:${moduleName}`);
        logger.debug(`Virtual module changed: ${moduleName}`);
      }
    }
  }

  logger.debug("Updating dependency mappings after virtual module structure change.");
  updateDependencyMappings(ctx);

  if (changedVirtualModules.size > 0 && server) {
    logger.info(`Detected ${changedVirtualModules.size} changed virtual modules. Triggering HMR.`);
    const { moduleGraph, hot } = server;
    for (const moduleName of changedVirtualModules) {
      const mod = moduleGraph.getModuleById(`\0${moduleName}`);
      if (mod) {
        logger.debug(`Invalidating module: ${mod.id}`);
        moduleGraph.invalidateModule(mod);
        const affected = new Set(mod.importers);
        affected.add(mod);

        if (affected.size > 0) {
          logger.info(
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
          logger.debug("HMR update sent for virtual module structure change.");
        }
      } else {
        logger.debug(`Module ${moduleName} not found in module graph.`);
      }
    }
    logger.info("Regenerating types after virtual module structure change.");
    await regenerateTypes(ctx);
  } else {
    logger.debug("No virtual module structure changes detected or server not available.");
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
