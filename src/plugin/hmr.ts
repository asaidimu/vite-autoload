import { ModuleGenerator } from "../generators/generator";
import { PluginConfig, PluginRuntime } from "./types";
import { regenerateTypes } from "./utils";
import { createFileWatcher } from "../watchers/file-watcher";


/**
 * Resolves the internal (null-byte-prefixed) virtual module ID for a given
 * public virtual module name (e.g. "widgets" -> "\0virtual:widgets").
 */
function resolvedVirtualId(name: string): string {
  return `\0virtual:${name}`;
}

/**
 * Registers chokidar listeners for structural changes (add/unlink).
 */
export function setupStructuralWatcher(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
): void {
  const { logger, options } = config;
  const { server } = runtime;

  if (!server) {
    logger.warn("Cannot set up structural watcher: server not available.");
    return;
  }

  const watchDirs = options.components.flatMap((component) =>
    component.groups
      .filter((group) => typeof group.input !== "function")
      .map((group) => (group.input as any).directory as string)
      .filter(Boolean),
  );

  if (watchDirs.length === 0) return;

  logger.debug(`Registering structural watcher for dirs: ${watchDirs.join(", ")}`);
  server.watcher.add(watchDirs);

  const handleStructuralChange = async (eventType: "add" | "unlink" | "change", file: string) => {
        if(eventType === "change") return
    if (!watchDirs.some((dir) => file.startsWith(dir))) return;

    logger.debug(`Structural change (${eventType}) detected: "${file}"`);

    for (const generator of generators) {
      if (eventType === "add") {
        generator.add(file);
      } else {
        if (!generator.match(file)) continue;
        generator.remove(file);
      }

      const data = await generator.data({ production: false })
          /* for (const virtualName of Object.keys(data)) {
            const id = resolvedVirtualId(virtualName);
            const mod = server.moduleGraph.getModuleById(id);
            if (mod) {
              server.moduleGraph.invalidateModule(mod, new Set(), Date.now(), true);
            }
          } */
          await regenerateTypes(config, generators);
          logger.debug(`Triggering full reload after structural change: ${file}`);
          // server.hot.send({ type: "full-reload" });
    }
  };

    const watcher = createFileWatcher(options, logger, handleStructuralChange)
    watcher.start()
}
