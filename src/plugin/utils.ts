import * as fs from "fs/promises";
import * as path from "path";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { PluginConfig } from "./types";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";

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
  adapter.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
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
