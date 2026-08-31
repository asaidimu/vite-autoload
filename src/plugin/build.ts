import * as path from "path";
import { PluginConfig, PluginRuntime } from "./types";
import { emitSitemap, emitManifest, regenerateTypes } from "./utils";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";
import { generateToDisk } from "../utils/disk-writer";

/**
 * Runs build start tasks: regenerates types.
 * Chunk emission is handled by disk-writer in closeBundle.
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
  await regenerateTypes(config, generators);
  logger.info("Build start tasks completed.");
}

/**
 * Finalizes the build by writing generated modules to dist/generated/,
 * then generating sitemap and manifest.
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
  const { logger, resolvedConfig } = config;
  logger.info("Running close bundle tasks...");

  // Write generated modules to dist/generated/ with deterministic filenames
  const buildOutputDir = path.join(
    resolvedConfig.build.outDir,
    "generated",
  );
  logger.debug("Writing generated modules to disk...");
  const groupNames = await generateToDisk(
    buildOutputDir,
    generators,
    { production: true },
    logger,
  );
  logger.info(
    `Wrote ${groupNames.length} generated module(s) to ${buildOutputDir}`,
  );

  logger.debug("Emitting manifest...");
  await emitManifest(config);
  logger.debug("Emitting sitemap...");
  await emitSitemap(adapter, config, generators);
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
