import path from "path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { createModuleGenerator } from "../generators/module-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { createFileWatcher } from "../watchers/file-watcher";
import { createLogger } from "./logger";
import { PluginOptions, RouteData } from "./types";
import { init, parse as parseImports } from "es-module-lexer";

/**
 * Creates a Vite plugin that autoloads and manages virtual modules based on filesystem data.
 * Supports dynamic module generation, HMR for importers, and production asset emission.
 *
 * @param {PluginOptions} options - Configuration options for the plugin.
 * @returns {Plugin} A Vite plugin instance.
 */
export function createAutoloadPlugin(options: PluginOptions): Plugin {
  // Logger for debugging and info messages, controlled by logLevel option
  const logger = createLogger(options.logLevel);

  // Maps file paths to their virtual module metadata for runtime tracking
  const fileToExportMap = new Map();

  // Store resolved Vite config and dev server instance
  let config: ResolvedConfig;
  let server: ViteDevServer;

  // Initialize module generators for "modules" and "routes"
  const modules = createModuleGenerator({
    name: "modules",
    config: options.modules,
  });

  const routes = createModuleGenerator({
    name: "routes",
    config: options.routes as any,
  });

  // Array of all handlers for virtual module management
  const handlers = [modules, routes];

  // File watcher for regenerating types on filesystem changes
  const fileWatcher = createFileWatcher(options, logger, async () => {
    if (!options.export?.types) return;

    try {
      const output = path.join(
        options.rootDir || process.cwd(),
        options.export.types,
      );
      const routeLimit = options.export?.routeLimit || 1000;
      const routeData = routes.data({ production: false });
      const types = {
        ApplicationRoute: Object.values(routeData)
          .flat()
          .filter((r) => !!r?.route)
          .slice(0, routeLimit)
          .map((r) => r.route),
      };

      for (const [key, value] of Object.entries(
        modules.data({ production: false }),
      )) {
        const type = options.modules[key]?.output?.types;
        if (type) {
          const { name, key: prop } = type;
          (types as any)[name] = (value as any[]).map((m) => m[prop]);
        }
      }

      await generateTypes(output, types);
      logger.info(
        `Types generated successfully (processed ${types.ApplicationRoute.length} routes)`,
      );
    } catch (error) {
      logger.error("Failed to generate types:", error);
    }
  });

  return {
    name: "vite-plugin-autoload",

    /**
     * Stores the resolved Vite configuration for use in other hooks.
     * @param {ResolvedConfig} resolvedConfig - Vite's resolved configuration.
     */
    configResolved(resolvedConfig: ResolvedConfig) {
      config = resolvedConfig;
    },

    /**
     * Configures the dev server, starting the file watcher and setting up initial route mappings.
     * @param {ViteDevServer} _server - The Vite development server instance.
     */
    configureServer: async (_server: ViteDevServer) => {
      server = _server;
      fileWatcher.start();
      server.watcher.on("close", () => fileWatcher.stop());

      const routeData = routes.data({ production: false });
      const chunkSize = options.chunkSize || 100;

      const mapRoutes = (
        entries: Array<RouteData>,
        virtualModule: string,
        exportKey: string,
      ) => {
        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);
          chunk.forEach((entry, index) => {
            if (entry?.path) {
              fileToExportMap.set(entry.path, {
                virtualModule,
                exportKey,
                index: i + index,
              });
            }
          });
        }
      };

      if (Array.isArray(routeData.views))
        mapRoutes(routeData.views, "virtual:routes", "views");
      if (Array.isArray(routeData.pages))
        mapRoutes(routeData.pages, "virtual:routes", "pages");
    },

    /**
     * Emits production chunks for all module files during the build process.
     */
    async buildStart() {
      if (config.isProduction) {
        const emit = this.emitFile.bind(this);
        const moduleFiles = handlers
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
    },

    buildEnd: () => {},

    /**
     * Resolves virtual module IDs to their internal representation.
     * @param {string} id - The module ID to resolve.
     * @returns {string|null} Resolved ID with \0 prefix or null if not a virtual module.
     */
    resolveId(id: string): string | null {
      const name = id.replace("virtual:", "");
      const found = handlers.find((g) => g.find(name));
      if (found) return `\0${id}`;
      return null;
    },

    /**
     * Loads the content of virtual modules based on their name.
     * @param {string} id - The resolved module ID.
     * @returns {string|null} The generated module code or null if not found.
     */
    async load(id: string): Promise<string | null> {
      const name = id.replace("\0virtual:", "");

      if (modules.find(name)) {
        return modules.code({
          production: config.isProduction,
          name,
        }) as string;
      }

      if (name === "routes") {
        return routes.code({ production: config.isProduction }) as string;
      }

      return null;
    },

    /**
     * Injects a manifest link into the HTML during production builds.
     */
    transformIndexHtml(html: string) {
      if (options.manifest) {
        const manifestPath = options.manifest.output || "manifest.webmanifest";
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
    },

    /**
     * Transforms modules that import virtual modules, injecting HMR support and registering dependencies.
     * @param {string} code - The module's source code.
     * @param {string} id - The module's ID.
     * @returns {object|null} Transformed code with HMR or null if no transformation.
     */
    async transform(
      code: string,
      id: string,
    ): Promise<object | null | undefined> {
      if (id.startsWith("\0") || !server || config.command !== "serve") {
        return;
      }
      if (code.includes("import.meta.hot")) {
        logger.debug(`Skipping HMR injection for ${id}: already has HMR code`);
        return null;
      }

      await init;
      let imports;

      try {
        [imports] = parseImports(code);
      } catch (e) {
        logger.error(`Failed to parse imports in ${id}:`, e);
        return null;
      }

      // List all virtual module IDs from handlers
      const virtualModuleIds = Object.keys(
        modules.data({ production: false }),
      ).map((key) => `virtual:${key}`);
      virtualModuleIds.push("virtual:routes");

      const importedVirtualIds = imports
        .map((imp) => imp.n)
        .filter(
          (importName) => importName && virtualModuleIds.includes(importName),
        ) as Array<string>;

      if (importedVirtualIds.length > 0) {
        let hasHmr = false;

        importedVirtualIds.forEach((virtualId) => {
          const name = virtualId.replace("virtual:", "");
          const handler = handlers.find((h) => h.find(name));
          if (!handler) return;

          const handlerData = handler.data({ production: false });
          const dataEntry = handlerData[name] || handlerData;
          const depFiles = Array.isArray(dataEntry)
            ? dataEntry.map((entry) => entry.path).filter(Boolean)
            : [];

          depFiles.forEach((file) => {
            const absolutePath = path.resolve(config.root, file.slice(1));
            this.addWatchFile(absolutePath);
          });

          hasHmr = true;
        });

        if (hasHmr) {
          const hmrCode = `
            import.meta.hot.accept();
          `;
          return {
            code: hmrCode + code,
            map: null,
          };
        }
      }
      return null;
    },

    /**
     * Handles file changes, regenerating handlers and triggering HMR for affected virtual modules.
     */
    handleHotUpdate({ file, server }) {
      const normalizedFile = path.resolve(file);

      let affectedHandler = null;
      let affectedVirtualModules = [];
      const affectedImporters = new Set();
      // Check if the changed file is a dependency of any virtual module
      for (const handler of handlers) {
        const data = handler.data({ production: false });
        for (const [key, entries] of Object.entries(data)) {
          const depFiles = Array.isArray(entries)
            ? entries.map((entry) => entry.path).filter(Boolean)
            : [];

          const absoluteDepFiles = depFiles.map((f) =>
            path.resolve(config.root, f.slice(1)),
          );
          if (absoluteDepFiles.includes(normalizedFile)) {
            affectedHandler = handler;
            affectedVirtualModules.push(`\0virtual:${key}`);
            const moduleNode = server.moduleGraph.getModuleById(normalizedFile);
            if (moduleNode && moduleNode.importers.size > 0) {
              moduleNode.importers.forEach((importer) =>
                affectedImporters.add(importer),
              );
            }
          }
        }
      }

      // Handle new files in watched directories
      /* if (!affectedHandler) {
        const watchedDirs = [
          ...(options.routes.views?.input || []),
          ...(options.routes.pages?.watch || []),
          ...Object.values(options.modules).flatMap((m) => m.watch || []),
        ].map((dir) => path.resolve(config.root, dir));

        if (watchedDirs.some((dir) => normalizedFile.startsWith(dir))) {
          handlers.forEach((handler) => {
            const data = handler.data({ production: false }); // Trigger refresh
            affectedVirtualModules.push(...Object.keys(data).map((key) => `\0virtual:${key}`));
          });
        } else {
          return;
        }
      } */

      console.log({ affectedVirtualModules, affectedImporters, file });
      if (affectedVirtualModules.length > 0 || affectedImporters.size > 0) {
        const affectedModules = new Set();

        // Invalidate virtual modules and their importers
        affectedVirtualModules.forEach((virtualId) => {
          const virtualModule = server.moduleGraph.getModuleById(virtualId);
          if (virtualModule) {
            server.moduleGraph.invalidateModule(virtualModule);
            affectedModules.add(virtualModule);
            virtualModule.importers.forEach((importer) => {
              server.moduleGraph.invalidateModule(importer);
              affectedModules.add(importer);
            });
          }
        });

        // Invalidate directly affected importers
        affectedImporters.forEach((importer: any) => {
          server.moduleGraph.invalidateModule(importer);
          affectedModules.add(importer);
        });

        // Send custom HMR event
        server.hot.send({
          type: "custom",
          event: "vite:autoload-changed",
          data: { file: normalizedFile },
        });

        logger.info(
          `Regenerated virtual modules and notified importers due to change in ${file}`,
        );
        return Array.from(affectedModules) as any;
      }
    },

    /**
     * Finalizes the build by generating manifests and sitemaps in production.
     */
    async closeBundle() {
      if (options.manifest) {
        generateManifest(options.manifest, config.build.outDir);
      }

      if (options.sitemap && config.isProduction) {
        const { baseUrl, exclude = [] } = options.sitemap;
        const routeData = routes.data({ production: true });
        const sitemapEntries = Object.values(routeData)
          .flat()
          .filter((r) => !!r?.route)
          .map((route) => ({
            route: route.route,
            metadata: route.metadata,
          }));

        const sitemap = generateSitemap(sitemapEntries, baseUrl, exclude);
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: sitemap,
        });
      }
    },
  };
}
