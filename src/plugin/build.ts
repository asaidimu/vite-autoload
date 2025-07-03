import { PluginConfig, PluginRuntime } from "./types";
import { emitSitemap, emitManifest, regenerateTypes } from "./utils";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";

/**
 * Emits production chunks for all module files.
 * This is called from the `buildStart` hook.
 *
 * @param adapter - The Vite adapter.
 * @param config - The plugin configuration.
 * @param generators - An array of module generators.
 */
export async function runBuildStart(
  adapter: ViteAdapter,
  config: PluginConfig,
  generators: ModuleGenerator[],
) {
  const { logger, resolvedConfig } = config;
  if (!resolvedConfig.isProduction) {
    logger.debug("Skipping build start tasks: not in production mode.");
    return;
  }

  logger.info("Running build start tasks...");

  logger.debug("Regenerating types...");
  await regenerateTypes(config, generators); // Pass config and generators

  const emit = adapter.emitFile; // Use adapter.emitFile
  logger.debug("Collecting module files for chunk emission...");
  const moduleFiles = await Promise.all(
    generators.map(async (g) => g.modules({ production: true })),
  ).then((files) => files.flat());

  logger.debug(`Found ${moduleFiles.length} module files to emit as chunks.`);
  moduleFiles.forEach((element) => {
    emit({
      type: "chunk",
      id: element.file,
      preserveSignature: "exports-only",
      fileName: element.uri.replace(/^\/+/g, ""),
    });
    logger.debug(
      `Emitted chunk for file: ${element.file} with fileName: ${element.uri.replace(/^\/+/g, "")}`,
    );
  });
  logger.info("Build start tasks completed.");
}

/**
 * Finalizes the build by generating sitemap and manifest.
 * This is called from the `closeBundle` hook.
 *
 * @param adapter - The Vite adapter.
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state.
 * @param generators - An array of module generators.
 */
export async function runCloseBundle(
  adapter: ViteAdapter,
  config: PluginConfig,
  runtime: PluginRuntime,
  generators: ModuleGenerator[],
) {
  const { logger } = config;
  logger.info("Running close bundle tasks...");
  logger.debug("Emitting manifest...");
  await emitManifest(config); // Pass config
  logger.debug("Emitting sitemap...");
  await emitSitemap(adapter, config, generators); // Pass adapter, config, and generators
  logger.info("Close bundle tasks completed.");
}

/**
 * Injects a manifest link into the final HTML file.
 * This is called from the `transformIndexHtml` hook.
 */
export function transformHtml(html: string, config: PluginConfig) {
  const { logger, options } = config;
  if (options.settings.manifest) {
    const manifestPath =
      options.settings.manifest.output || "manifest.webmanifest";
    logger.debug(
      `Transforming HTML: Injecting manifest link for ${manifestPath}`,
    );
    return {
      html,
      tags: [
        {
          tag: "link",
          attrs: { rel: "manifest", href: "/" + manifestPath },
          injectTo: "head",
        },
      ],
    };
  }
  logger.debug(
    "Transforming HTML: No manifest configuration found, skipping injection.",
  );
  return html;
}
