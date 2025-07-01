import type { ManifestConfig } from "../types";
import path from "path";
import fs from "fs";

export function generateManifest(
  config: ManifestConfig,
  outDir: string,
): string {
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
  fs.writeFileSync(outputPath, manifestContent);

  return outputPath;
}
