import { PluginContext } from "./types";
import { emitSitemap, emitManifest } from "./utils";

/**
 * Emits production chunks for all module files.
 * This is called from the `buildStart` hook.
 */
export async function runBuildStart(this: any, ctx: PluginContext) {
  if (!ctx.config.isProduction) return;

  const emit = this.emitFile.bind(this);
  const moduleFiles = ctx.generators
    .map((g) => g.modules({ production: true }))
    .flat();

  moduleFiles.forEach((element) => {
    emit({
      type: "chunk",
      id: element.file,
      preserveSignature: "exports-only",
      fileName: element.uri.replace(/^\/+/g, ""),
    });
  });
}

/**
 * Finalizes the build by generating sitemap and manifest.
 * This is called from the `closeBundle` hook.
 */
export async function runCloseBundle(this: any, ctx: PluginContext) {
  emitManifest(ctx);
  emitSitemap.call(this, ctx);
}

/**
 * Injects a manifest link into the final HTML file.
 * This is called from the `transformIndexHtml` hook.
 */
export function transformHtml(html: string, ctx: PluginContext) {
  if (ctx.options.settings.manifest) {
    const manifestPath =
      ctx.options.settings.manifest.output || "manifest.webmanifest";
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
  return html;
}
