import { PluginContext } from "./types";
import { emitSitemap, emitManifest, regenerateTypes } from "./utils";

/**
 * Emits production chunks for all module files.
 * This is called from the `buildStart` hook.
 */
export async function runBuildStart(this: any, ctx: PluginContext) {
  const { logger, config } = ctx;
  if (!config.isProduction) {
    logger.debug("Skipping build start tasks: not in production mode.");
    return;
  }

  logger.info("Running build start tasks...");

  logger.debug("Regenerating types...");
  await regenerateTypes(ctx);

  const emit = this.emitFile.bind(this);
  logger.debug("Collecting module files for chunk emission...");
  const moduleFiles = await Promise.all(
    ctx.generators.map(async (g) => g.modules({ production: true })),
  ).then((files) => files.flat());

  logger.debug(`Found ${moduleFiles.length} module files to emit as chunks.`);
  moduleFiles.forEach((element) => {
    emit({
      type: "chunk",
      id: element.file,
      preserveSignature: "exports-only",
      fileName: element.uri.replace(/^\/+/g, "")
    });
    logger.debug(`Emitted chunk for file: ${element.file} with fileName: ${element.uri.replace(/^\/+/g, "")}`);
  });
  logger.info("Build start tasks completed.");
}

/**
 * Finalizes the build by generating sitemap and manifest.
 * This is called from the `closeBundle` hook.
 */
export async function runCloseBundle(this: any, ctx: PluginContext) {
  const { logger } = ctx;
  logger.info("Running close bundle tasks...");
  logger.debug("Emitting manifest...");
    await emitManifest(ctx);
  logger.debug("Emitting sitemap...");
  await emitSitemap.call(this, ctx);
  logger.info("Close bundle tasks completed.");
}

/**
 * Injects a manifest link into the final HTML file.
 * This is called from the `transformIndexHtml` hook.
 */
export function transformHtml(html: string, ctx: PluginContext) {
  const { logger, options } = ctx;
  if (options.settings.manifest) {
    const manifestPath =
      options.settings.manifest.output || "manifest.webmanifest";
    logger.debug(`Transforming HTML: Injecting manifest link for ${manifestPath}`);
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
  logger.debug("Transforming HTML: No manifest configuration found, skipping injection.");
  return html;
}
