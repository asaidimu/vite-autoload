import * as fs from "fs/promises";
import * as path from "path";
import { generateTypes } from "../generators/types-generator";
import { Logger } from "../utils/logger";
import { generateManifest } from "../generators/manifest-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { PluginContext } from "./types";
import { fnv1a64Hash } from "../utils/hash";

/**
 * Calculates a hash for any data structure, including file content hashes for ResolvedFile objects.
 */
export const getDataHash = async (data: any, logger?: Logger): Promise<string> => {
  logger?.debug("Calculating data hash...");
  const finalHash = fnv1a64Hash(data)
  logger?.debug(`Data hash calculated: ${finalHash}`);
  return finalHash;
};

/**
 * Checks if a virtual module's content has changed based on its data hash.
 */
export const hasVirtualModuleChanged = async (
  ctx: PluginContext,
  moduleName: string,
): Promise<boolean> => {
  const { logger } = ctx;
  logger.debug(`Checking if virtual module ${moduleName} has changed...`);
  const found = ctx.nameIndex.lookup(moduleName);

  if (!found) {
    logger.warn(`Virtual module ${moduleName} not found in NameIndex.`);
    return false;
  }

  // Find the generator for the component
  const generator = ctx.generators.find((g) => g.name === found.component);
  if (!generator) {
    logger.error(`Generator for component ${found.component} not found.`);
    return false;
  }

  // Pass the group name if it exists, otherwise undefined (for component-level modules)
  const dataContext = {
    production: false,
    name: found.group ? moduleName : undefined
  };

  const currentData = await generator.data(dataContext);
  const currentHash = await getDataHash(currentData, logger);
  const previousHash = ctx.virtualModuleCache.get(moduleName);

  logger.debug(`Module ${moduleName}: Current hash: ${currentHash}, Previous hash: ${previousHash}`);

  const hasChanged = previousHash !== currentHash;
  if (hasChanged) {
    ctx.virtualModuleCache.set(moduleName, currentHash);
    logger.debug(`Virtual module ${moduleName} has changed`);
  } else {
    logger.debug(`Virtual module ${moduleName} has NOT changed`);
  }
  return hasChanged;
};

/**
 * Generates TypeScript definition files based on plugin options and current data.
 */
export async function regenerateTypes(ctx: PluginContext) {
  const { options, logger, generators } = ctx;
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
            if (typeof item !== 'string') {
              logger.warn(`Skipping non-string value for type generation: ${JSON.stringify(item)}`);
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
 */
export async function emitSitemap(this: any, ctx: PluginContext) {
  if (!ctx.options.settings.sitemap || !ctx.config.isProduction) return;

  const { baseUrl, exclude = [] } = ctx.options.settings.sitemap;
  const sitemapEntries: { route: string; metadata: any }[] = [];

  for (const [index, component] of ctx.options.components.entries()) {
    if (component.strategy.sitemap) {
      const generator = ctx.generators[index];
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
  };
  const sitemap = generateSitemap(sitemapEntries, baseUrl, exclude, ctx.logger);

  const outputPath = path.join(ctx.config.build.outDir, "sitemap.xml");
  await fs.writeFile(outputPath, sitemap, "utf-8");
  ctx.logger.info(`Sitemap written to ${outputPath}`);
}

/**
 * Generates the web manifest file.
 */
export async function emitManifest(ctx: PluginContext) {
  if (ctx.options.settings.manifest) {
    await generateManifest(ctx.options.settings.manifest, ctx.config.build.outDir, ctx.logger);
  }
}
