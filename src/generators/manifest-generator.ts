import type { ManifestConfig } from "../types/manifest"; // Adjusted import path
import path from "path";
import fs from "fs";

import { Logger } from "../utils/logger";

/**
 * Generates a web manifest file based on the provided configuration.
 *
 * @param config - The manifest configuration.
 * @param outDir - The output directory for the manifest file.
 * @param logger - Optional logger instance.
 * @returns A promise that resolves to the output path of the manifest file.
 */
export async function generateManifest(
  config: ManifestConfig,
  outDir: string,
  logger?: Logger,
): Promise<string> {
  logger?.debug("Generating web manifest...");
  const manifestContent = JSON.stringify(
    {
      name: config.name,
      short_name: config.shortName,
      description: config.description,
      theme_color: config.theme_color,
      background_color: config.background_color,
      display: config.display || "standalone",
      orientation: config.orientation,
      scope: config.scope || "/",
      start_url: config.start_url || "/",
      icons: config.icons || [],
      screenshots: config.screenshots,
      related_applications: config.related_applications,
      prefer_related_applications: config.prefer_related_applications,
      categories: config.categories,
      dir: config.dir,
      lang: config.lang,
      iarc_rating_id: config.iarc_rating_id,
    },
    null,
    2,
  );

  const outputPath = path.join(outDir, config.output || "manifest.webmanifest");

  let existingContent = "";
  try {
    existingContent = await fs.promises.readFile(outputPath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      logger?.error(
        `Error reading existing manifest file ${outputPath}:`,
        error,
      );
    }
  }

  if (existingContent !== manifestContent) {
    await fs.promises.writeFile(outputPath, manifestContent);
    logger?.debug(`Web manifest generated at: ${outputPath}`);
  } else {
    logger?.debug(
      `Web manifest content unchanged, skipping write: ${outputPath}`,
    );
  }

  return outputPath;
}
