import { ModuleGenerator } from "../generators/generator";
import { PluginConfig, PluginRuntime } from "./types";
import { regenerateTypes } from "./utils";

/**
 * Initializes the dev server by generating types and registering the
 * structural file watcher (add/unlink events).
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 */
export async function initializeDevServer(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  const { logger } = config;
  logger.info("Initializing dev server...");
  await regenerateTypes(config, generators);
  // setupStructuralWatcher(config, runtime, generators);
  logger.info("Dev server initialized.");
}
