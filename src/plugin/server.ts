import * as path from "path";
import { ModuleGenerator } from "../generators/generator";
import { PluginConfig, PluginRuntime } from "./types";
import { regenerateTypes } from "./utils";
import { generateToDisk } from "../utils/disk-writer";
import { createFileWatcher } from "../watchers/file-watcher";

/**
 * Resolves the absolute output directory path for generated modules.
 */
export function getOutputDir(config: PluginConfig): string {
  const rootDir =
    config.options.settings.rootDir ||
    config.resolvedConfig?.root ||
    process.cwd();
  return path.resolve(rootDir, config.options.settings.outputDir || "src/generated");
}

/**
 * Initializes the dev server:
 * 1. Writes generated modules to disk
 * 2. Registers the output directory with Vite's watcher for native HMR
 * 3. Sets up a source file watcher to regenerate on changes
 */
export async function initializeDevServer(
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  const { logger } = config;
  const { server } = runtime;

  logger.info("Initializing dev server...");

  // 1. Generate types
  await regenerateTypes(config, generators);

  // 2. Write generated modules to disk
  const outputDir = getOutputDir(config);
  const groupNames = await generateToDisk(
    outputDir,
    generators,
    { production: false },
    logger,
  );
  logger.info(
    `Generated ${groupNames.length} module(s) to ${outputDir}`,
  );

  // 3. Register output directory with Vite's watcher for native HMR
  if (server) {
    server.watcher.add(outputDir);
    logger.debug(`Registered ${outputDir} with Vite watcher for HMR`);

    // 4. Watch source files and regenerate on changes
    const watchDirs = config.options.components
      .flatMap((c) => c.groups)
      .filter((g) => typeof g.input !== "function")
      .map((g) => (g.input as any).directory as string)
      .filter(Boolean);

    if (watchDirs.length > 0) {
      const onChange = async (
        eventType: "add" | "unlink" | "change",
        file: string,
      ) => {
        logger.debug(`Source file ${eventType}: ${file}`);

        // Update generators for structural changes
        if (eventType === "add") {
          for (const g of generators) g.add(file);
        } else if (eventType === "unlink") {
          for (const g of generators) {
            if (g.match(file)) g.remove(file);
          }
        } else {
          // "change" — touch to invalidate cache
          for (const g of generators) g.touch(file);
        }

        // Regenerate disk files
        await generateToDisk(
          outputDir,
          generators,
          { production: false },
          logger,
        );
        await regenerateTypes(config, generators);
      };

      const watcher = createFileWatcher(
        config.options,
        logger,
        onChange,
      );
      watcher.start();
      logger.debug(`Source watcher started for: ${watchDirs.join(", ")}`);
    }
  }

  logger.info("Dev server initialized.");
}
