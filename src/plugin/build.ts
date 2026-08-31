import { PluginConfig, PluginRuntime } from "./types";
import { emitSitemap, emitManifest, regenerateTypes } from "./utils";
import { ModuleGenerator } from "../generators/generator";
import { ViteAdapter } from "./vite-adapter";
import { createUriTransformer } from "../utils/uri";

/**
 * Runs build start tasks: regenerates types and emits production chunks.
 * In production, source files are emitted as chunks so that virtual module
 * imports resolve to real compiled files.
 *
 * @param adapter - The Vite adapter.
 * @param config - The plugin configuration.
 * @param runtime - The plugin runtime state (receives sourceToChunk mapping).
 * @param generators - An array of module generators.
 */
export async function runBuildStart(
  adapter: ViteAdapter,
  config: PluginConfig,
  runtime: PluginRuntime,
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

  // Emit source files as chunks and build sourceToChunk mapping
  const emit = adapter.emitFile;
  const uriTransformer = createUriTransformer();
  const sourceToChunk = new Map<string, string>();

  logger.debug("Collecting module files for chunk emission...");
  const moduleFiles = await Promise.all(
    generators.map(async (g) => g.modules({ production: true })),
  ).then((files) => files.flat());

  logger.debug(`Found ${moduleFiles.length} module files to emit as chunks.`);
  moduleFiles.forEach((element) => {
    const chunkFileName = uriTransformer.transform({
      uri: element.uri,
      production: true,
    });
    const relativeChunkPath = chunkFileName.replace(/^\/+/g, "");

    emit({
      type: "chunk",
      id: element.file,
      preserveSignature: "exports-only",
      fileName: relativeChunkPath,
    });

    // Store mapping: source path → chunk filename (with leading /)
    sourceToChunk.set(element.uri, chunkFileName);
    logger.debug(
      `Emitted chunk for file: ${element.file} -> ${chunkFileName}`,
    );
  });

  // Store mapping in runtime for use by load hook
  runtime.sourceToChunk = sourceToChunk;
  logger.debug(`Built sourceToChunk mapping with ${sourceToChunk.size} entries.`);

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
