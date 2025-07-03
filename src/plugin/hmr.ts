import path from "path";
import { normalizePath } from "vite";
import { PluginConfig, PluginRuntime, PluginContext } from "./types";
import { hasVirtualModuleChanged, regenerateTypes, getDataHash } from "./utils";
import {
  updateDependencyMappings,
  establishDirectDependencies,
} from "./dependencies";
import { init, parse as parseImports } from "es-module-lexer";
import { isJavaScriptLikeModule } from "../utils/checkers";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";

/**
 * Creates a file watcher callback that triggers HMR.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 * @returns A function that handles changed files.
 */
export function createHmrFileWatcherCallback(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  return async (changedFiles: string[]) => {
    config.logger.debug(`Files changed: ${changedFiles.join(", ")}`);
    for (const changedFile of changedFiles) {
      for (const generator of generators) {
        if (generator.match(changedFile)) {
          generator.touch(changedFile);
        }
      }
    }
    await handleVirtualModuleStructureChange(config, runtime, generators);
  };
}

/**
 * Initializes the dev server by caching data, setting up dependencies, and starting the file watcher.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 * @param fileWatcher - The file watcher instance.
 */
export async function initializeDevServer(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
  fileWatcher: any,
) {
  const { logger } = config;
  const { virtualModuleCache } = runtime;

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
  updateDependencyMappings(config, runtime, generators); // Pass generators

  logger.info("Starting file watcher...");
  fileWatcher.start();
  runtime.server?.watcher.on("close", () => {
    logger.info("Dev server closed. Stopping file watcher.");
    fileWatcher.stop();
  });
  logger.info("Dev server initialized.");
}

/**
 * Handles HMR for changes *within* a file that is part of a virtual module.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param file - The path to the changed file.
 * @returns An array of modules to be hot updated.
 */
export function handleHotUpdate(
  config: PluginConfig,
  runtime: PluginRuntime,
  file: string,
) {
  const { logger } = config;
  const { server, fileToExportMap, importerToVirtualDeps } = runtime;
  if (!server) {
    logger.warn("HMR: Vite server not available.");
    return [];
  }

  const normalizedFile = normalizePath(path.resolve(file));
  const mapping = fileToExportMap.get(normalizedFile);

  if (!mapping) {
    logger.debug(`File ${normalizedFile} is not tracked by any virtual module`);
    return [];
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
 *
 * @param adapter - The Vite adapter.
 * @param code - The module code.
 * @param id - The module ID.
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 * @returns The transformed code or null.
 */
export async function transformImporterModule(
  adapter: ViteAdapter,
  code: string,
  id: string,
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
): Promise<{ code: string; map: null } | null> {
  config.logger.debug(`transformImporterModule called for id: ${id}`);
  if (
    id.startsWith("\0") ||
    !runtime.server ||
    config.resolvedConfig.command !== "serve" ||
    !isJavaScriptLikeModule(id)
  ) {
    config.logger.debug(
      `Skipping transformation for ${id} due to filter conditions.`,
    );
    return null;
  }

  try {
    await init;
    const [imports] = parseImports(code);
    config.logger.debug(`Parsed imports for ${id}:`, imports);

    const virtualModuleIds = generators
      .flatMap((g) => Object.keys(g.data({ production: false })))
      .map((key) => `virtual:${key}`);
    config.logger.debug(`Expected virtual module IDs:`, virtualModuleIds);

    const importedVirtualIds = imports
      .map((imp) => imp.n)
      .filter((name) => name && virtualModuleIds.includes(name)) as string[];
    config.logger.debug(
      `Found imported virtual IDs for ${id}:`,
      importedVirtualIds,
    );

    if (importedVirtualIds.length > 0) {
      config.logger.debug(
        `Establishing direct dependencies for ${id} with virtual modules:`,
        importedVirtualIds,
      );
      const _establishDirectDependencies = (
        c: PluginConfig,
        r: PluginRuntime,
        i: string,
        v: string[],
      ) => establishDirectDependencies(c, r, i, v);
      _establishDirectDependencies(config, runtime, id, importedVirtualIds);
      const hmrInjector = getHmrCodeInjector(adapter, config, runtime);
      const result = hmrInjector(id, importedVirtualIds);
      config.logger.debug(`HMR injector result for ${id}:`, result);
      return result ? { code: code + result.code, map: null } : null;
    }
  } catch (error) {
    config.logger.error(`Failed to transform ${id}:`, error);
  }

  return null;
}

// --- Internal Functions ---

/**
 * Handles HMR for virtual module *structure* changes (e.g., adding/deleting a file).
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 */
async function handleVirtualModuleStructureChange(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  const { logger, resolvedConfig } = config;
  const { server, virtualModuleCache } = runtime;
  if (!server && !resolvedConfig.isProduction) {
    logger.debug(
      "Skipping virtual module structure change handling: server not available and not in production.",
    );
    return;
  }

  logger.info("Handling virtual module structure change...");
  const changedVirtualModules = new Set<string>();

  for (const generator of generators) {
    logger.debug(`Checking generator: ${generator.name} for changes.`);
    const data = await generator.data({ production: false });
    for (const moduleName of Object.keys(data)) {
      if (
        await hasVirtualModuleChanged(config, runtime, moduleName, generators)
      ) {
        // Pass generators
        changedVirtualModules.add(`virtual:${moduleName}`);
        logger.debug(`Virtual module changed: ${moduleName}`);
      }
    }
  }

  logger.debug(
    "Updating dependency mappings after virtual module structure change.",
  );
  updateDependencyMappings(config, runtime, generators); // Pass generators

  if (changedVirtualModules.size > 0 && server) {
    logger.info(
      `Detected ${changedVirtualModules.size} changed virtual modules. Triggering HMR.`,
    );
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
    await regenerateTypes(config, generators); // Pass generators
  } else {
    logger.debug(
      "No virtual module structure changes detected or server not available.",
    );
  }
}

/**
 * Injects HMR boilerplate into modules that import virtual modules.
 *
 * @param adapter - The Vite adapter.
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @returns A function that returns the HMR code to inject.
 */
function getHmrCodeInjector(
  adapter: ViteAdapter,
  config: PluginConfig,
  runtime: PluginRuntime,
) {
  return (
    id: string,
    importedVirtualIds: string[],
  ): { code: string; map: null } | null => {
    config.logger.debug(
      `Module ${id} imports virtual modules:`,
      importedVirtualIds,
    );

    importedVirtualIds.forEach((virtualId) => {
      const fileDeps = runtime.virtualModuleDeps.get(virtualId);
      if (fileDeps) {
        fileDeps.forEach((filePath) => {
          adapter.addWatchFile(filePath); // Use adapter.addWatchFile
          config.logger.debug(
            `Added watch file: ${filePath} for importer: ${id}`,
          );
        });
      }
    });

    const hmrCode = `
// vite-plugin-autoload: HMR handling
if (import.meta.hot) {
  import.meta.hot.accept();
}`;
    return { code: hmrCode, map: null };
  };
}
