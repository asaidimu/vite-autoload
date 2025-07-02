import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { PluginContext } from "./types";
import { ResolvedFile } from "../types/transform";

/**
 * Calculates a hash for any data structure, including file content hashes for ResolvedFile objects.
 */
export const getDataHash = async (data: any): Promise<string> => {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(data));

  // If the data contains ResolvedFile objects, hash their content
  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === "object") {
        for (const key in item) {
          if (isResolvedFile(item[key])) {
            try {
              const fileContent = await fs.readFile(item[key].path, "utf-8");
              hash.update(fileContent);
            } catch (error) {
              console.warn(`Could not read file ${item[key].path}:`, error);
            }
          }
        }
      }
    }
  } else if (typeof data === "object" && data !== null) {
    for (const key in data) {
      if (isResolvedFile(data[key])) {
        try {
          const fileContent = await fs.readFile(data[key].path, "utf-8");
          hash.update(fileContent);
        } catch (error) {
          console.warn(`Could not read file ${data[key].path}:`, error);
        }
      } else if (Array.isArray(data[key])) {
        for (const item of data[key]) {
          if (isResolvedFile(item)) {
            try {
              const fileContent = await fs.readFile(item.path, "utf-8");
              hash.update(fileContent);
            } catch (error) {
              console.warn(`Could not read file ${item.path}:`, error);
            }
          }
        }
      }
    }
  }

  return hash.digest("hex");
};

function isResolvedFile(obj: any): obj is ResolvedFile {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "uri" in obj &&
    "path" in obj &&
    "file" in obj
  );
}

/**
 * Checks if a virtual module's content has changed based on its data hash.
 */
export const hasVirtualModuleChanged = async (
  ctx: PluginContext,
  moduleName: string,
): Promise<boolean> => {
  const found = ctx.nameIndex.lookup(moduleName);

  if (!found) {
    ctx.logger.warn(`Virtual module ${moduleName} not found in NameIndex.`);
    return false;
  }

  // Find the generator for the component
  const generator = ctx.generators.find((g) => g.name === found.component);
  if (!generator) {
    ctx.logger.error(`Generator for component ${found.component} not found.`);
    return false;
  }

  // Pass the group name if it exists, otherwise undefined (for component-level modules)
  const dataContext = {
    production: false,
    name: found.group || undefined,
  };

  const currentData = await generator.data(dataContext);
  const currentHash = await getDataHash(currentData);
  const previousHash = ctx.virtualModuleCache.get(moduleName);

  const hasChanged = previousHash !== currentHash;
  if (hasChanged) {
    ctx.virtualModuleCache.set(moduleName, currentHash);
    ctx.logger.debug(`Virtual module ${moduleName} has changed`);
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
