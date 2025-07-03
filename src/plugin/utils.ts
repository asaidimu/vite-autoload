import * as fs from "fs/promises";
import * as path from "path";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { PluginConfig, PluginRuntime } from "./types";
import { fnv1a64Hash } from "../utils/hash";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";

/**
 * Calculates a hash for any data structure, including file content hashes for ResolvedFile objects.
 *
 * @param data - The data to hash.
 * @param logger - Optional logger instance.
 * @returns The calculated hash as a string.
 */
export const getDataHash = async (
  data: any,
  logger?: PluginConfig["logger"],
): Promise<string> => {
  logger?.debug("Calculating data hash...");
  const finalHash = fnv1a64Hash(data);
  logger?.debug(`Data hash calculated: ${finalHash}`);
  return finalHash;
};

/**
 * Checks if a virtual module's content has changed based on its data hash.
 * This function modifies the virtualModuleCache in PluginRuntime.
 *
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param moduleName - The name of the virtual module.
 * @param generators - An array of module generators.
 * @returns True if the virtual module has changed, false otherwise.
 */
export const hasVirtualModuleChanged = async (
  config: PluginConfig,
  runtime: PluginRuntime,
  moduleName: string,
  generators: ModuleGenerator[],
): Promise<boolean> => {
  const { logger, nameIndex } = config;
  const { virtualModuleCache } = runtime;

  logger.debug(`Checking if virtual module ${moduleName} has changed...`);
  const found = nameIndex.lookup(moduleName);

  if (!found) {
    logger.warn(`Virtual module ${moduleName} not found in NameIndex.`);
    return false;
  }

  // Find the generator for the component
  const generator = generators.find((g) => g.name === found.component);
  if (!generator) {
    logger.error(`Generator for component ${found.component} not found.`);
    return false;
  }

  // Pass the group name if it exists, otherwise undefined (for component-level modules)
  const dataContext = {
    production: false,
    name: found.group ? moduleName : undefined,
  };

  const currentData = await generator.data(dataContext);
  const currentHash = await getDataHash(currentData, logger);
  const previousHash = virtualModuleCache.get(moduleName);

  logger.debug(
    `Module ${moduleName}: Current hash: ${currentHash}, Previous hash: ${previousHash}`,
  );

  const hasChanged = previousHash !== currentHash;
  if (hasChanged) {
    virtualModuleCache.set(moduleName, currentHash);
    logger.debug(`Virtual module ${moduleName} has changed`);
  } else {
    logger.debug(`Virtual module ${moduleName} has NOT changed`);
  }
  return hasChanged;
};

/**
 * Generates TypeScript definition files based on plugin options and current data.
 *
 * @param config - The plugin configuration.
 * @param generators - An array of module generators.
 */
export async function regenerateTypes(
  config: PluginConfig,
  generators: ModuleGenerator[],
) {
  const { options, logger } = config;
  const exportTypesPath = options.settings.export?.types;
  if (!exportTypesPath) return;

  try {
    const output = path.join(
      options.settings.rootDir || process.cwd(),
      exportTypesPath,
    );
    const types: { [key: string]: any } = {};
    let totalTypesCount = 0;

    for (const [index, component] of options.components.entries()) {
      if (component.strategy.types) {
        const generator = generators[index];
        const data = await generator.data({ production: false });
        const { name, property } = component.strategy.types;
        const collectedTypes = Object.values(data)
          .flat()
          .map((item: any) => item && item[property])
          .filter(Boolean)
          .filter((item) => {
            if (typeof item !== "string") {
              logger.warn(
                `Skipping non-string value for type generation: ${JSON.stringify(item)}`,
              );
              return false;
            }
            return true;
          });

        if (collectedTypes.length > 0) {
          types[name] = collectedTypes;
          totalTypesCount += collectedTypes.length;
        }
      }
    }

    if (Object.keys(types).length > 0) {
      await generateTypes(output, types, logger);
      logger.info(
        `Types generated successfully (processed ${totalTypesCount} items)`,
      );
    }
  } catch (error) {
    logger.error("Failed to generate types:", error);
  }
}

/**
 * Generates the sitemap.xml file.
 *
 * @param adapter - The Vite adapter.
 * @param config - The plugin configuration.
 * @param generators - An array of module generators.
 */
export async function emitSitemap(
  adapter: ViteAdapter,
  config: PluginConfig,
  generators: ModuleGenerator[],
) {
  if (!config.options.settings.sitemap || !config.resolvedConfig.isProduction)
    return;

  const { baseUrl, exclude = [] } = config.options.settings.sitemap;
  const sitemapEntries: { route: string; metadata: any }[] = [];

  for (const [index, component] of config.options.components.entries()) {
    if (component.strategy.sitemap) {
      const generator = generators[index];
      const data = await generator.data({ production: true });
      const property = component.strategy.sitemap.property;

      Object.values(data)
        .flat()
        .forEach((item: any) => {
          if (item && item[property]) {
            sitemapEntries.push({
              route: item[property],
              metadata: item.metadata,
            });
          }
        });
    }
  }
  const sitemap = generateSitemap(
    sitemapEntries,
    baseUrl,
    exclude,
    config.logger,
  );

  const outputPath = path.join(
    config.resolvedConfig.build.outDir,
    "sitemap.xml",
  );
  await fs.writeFile(outputPath, sitemap, "utf-8");
  adapter.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap }); // Use adapter.emitFile
  config.logger.info(`Sitemap written to ${outputPath}`);
}

/**
 * Generates the web manifest file.
 *
 * @param config - The plugin configuration.
 */
export async function emitManifest(config: PluginConfig) {
  if (config.options.settings.manifest) {
    await generateManifest(
      config.options.settings.manifest,
      config.resolvedConfig.build.outDir,
      config.logger,
    );
  }
}
