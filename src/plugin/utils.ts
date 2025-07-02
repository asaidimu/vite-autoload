import * as fs from "fs/promises";
import * as path from "path";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { PluginContext } from "./types";

/**
 * Calculates a JSON string hash for any data structure to detect changes.
 */
export const getDataHash = (data: any): string => {
  return JSON.stringify(data);
};

/**
 * Checks if a virtual module's content has changed based on its data hash.
 */
export const hasVirtualModuleChanged = async (
  ctx: PluginContext,
  name: string,
): Promise<boolean> => {
  const generator = ctx.generators.find((g) => g.name === name);
  if (!generator) return false;

  const currentData = await generator.data({ production: false });
  const currentHash = getDataHash(currentData);
  const previousHash = ctx.virtualModuleCache.get(name);

  const hasChanged = previousHash !== currentHash;
  if (hasChanged) {
    ctx.virtualModuleCache.set(name, currentHash);
    ctx.logger.debug(`Virtual module ${name} has changed`);
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
          .filter(Boolean);

        if (collectedTypes.length > 0) {
          types[name] = collectedTypes;
          totalTypesCount += collectedTypes.length;
        }
      }
    }

    if (Object.keys(types).length > 0) {
      await generateTypes(output, types);
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
  const sitemap = generateSitemap(sitemapEntries, baseUrl, exclude);

  const outputPath = path.join(ctx.config.build.outDir, "sitemap.xml");
  await fs.writeFile(outputPath, sitemap, "utf-8");
  ctx.logger.info(`Sitemap written to ${outputPath}`);
}

/**
 * Generates the web manifest file.
 */
export async function emitManifest(ctx: PluginContext) {
  if (ctx.options.settings.manifest) {
    await generateManifest(ctx.options.settings.manifest, ctx.config.build.outDir);
  }
}
