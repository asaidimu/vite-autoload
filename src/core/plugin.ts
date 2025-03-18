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
import { normalizePath } from "vite";

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
  const fileToExportMap = new Map<
    string,
    {
      virtualModule: string;
      exportKey: string;
      index: number;
    }
  >();

  // Maps virtual module IDs to their data hash for change detection
  const virtualModuleCache = new Map<string, string>();

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

  /**
   * Calculates a hash for module data to detect changes
   */
  const getDataHash = (data: any): string => {
    return JSON.stringify(data);
  };

  /**
   * Detects if a virtual module's data has changed
   */
  const hasVirtualModuleChanged = (name: string, handler: any): boolean => {
    const currentData = handler.data({ production: false });
    const dataKey = name === "routes" ? "" : name;
    const currentModule = currentData[dataKey] || currentData;
    const currentHash = getDataHash(currentModule);
    const previousHash = virtualModuleCache.get(name);

    const hasChanged = previousHash !== currentHash;
    if (hasChanged) {
      virtualModuleCache.set(name, currentHash);
      logger.debug(`Virtual module ${name} has changed`);
    }
    return hasChanged;
  };

  /**
   * Updates dependencies and virtual module mappings after filesystem changes
   */
  const updateDependencyMappings = () => {
    logger.debug("Updating dependency mappings");
    fileToExportMap.clear();

    const routeData = routes.data({ production: false });
    const chunkSize = options.chunkSize || 100;

    // Helper to map routes to their virtual modules
    const mapRoutes = (
      entries: Array<RouteData>,
      virtualModule: string,
      exportKey: string,
    ) => {
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        chunk.forEach((entry, index) => {
          if (entry?.path) {
            const normalizedPath = normalizePath(entry.path);
            fileToExportMap.set(normalizedPath, {
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

    // Map module dependencies
    for (const [key, moduleEntries] of Object.entries(
      modules.data({ production: false }),
    )) {
      if (Array.isArray(moduleEntries)) {
        moduleEntries.forEach((entry, index) => {
          if (entry?.path) {
            const normalizedPath = normalizePath(entry.path);
            fileToExportMap.set(normalizedPath, {
              virtualModule: `virtual:${key}`,
              exportKey: key,
              index,
            });
          }
        });
      }
    }
  };

  // File watcher for regenerating types on filesystem changes
  const fileWatcher = createFileWatcher(
    options,
    logger,
    async (changedFiles) => {
      if (!server && !config.isProduction) return;

      logger.debug(`Files changed: ${changedFiles.join(", ")}`);

      // Detect which virtual modules need updates
      const changedVirtualModules = new Set<string>();

      // Check if routes or modules have changed
      if (hasVirtualModuleChanged("routes", routes)) {
        changedVirtualModules.add("virtual:routes");
      }

      for (const moduleName of Object.keys(
        modules.data({ production: false }),
      )) {
        if (hasVirtualModuleChanged(moduleName, modules)) {
          changedVirtualModules.add(`virtual:${moduleName}`);
        }
      }

      // Update dependency mappings
      updateDependencyMappings();

      // Trigger HMR updates in development mode
      if (server && changedVirtualModules.size > 0) {
        const moduleGraph = server.moduleGraph;

        for (const moduleName of changedVirtualModules) {
          const virtualId = `\0${moduleName}`;
          const mod = moduleGraph.getModuleById(virtualId);

          if (mod) {
            moduleGraph.invalidateModule(mod);
            // Invalidate all importers
            const affectedModules = new Set([mod]);

            mod.importers.forEach((importer) => {
              moduleGraph.invalidateModule(importer);
              affectedModules.add(importer);
            });

            // Send HMR update
            if (affectedModules.size > 0) {
              logger.info(
                `Sending HMR update for ${moduleName} (affecting ${affectedModules.size} modules)`,
              );
              /* @ts-ignore */
              server.hot.send({
                type: "update",
                updates: Array.from(affectedModules).map((m) => ({
                  type: "js-update",
                  timestamp: Date.now(),
                  path: m.id || m.file,
                  acceptedPath: m.id || m.file,
                })),
              });
            }
          }
        }
      }

      // Generate types if enabled
      if (options.export?.types) {
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
      }
    },
  );

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

      // Initialize virtual module cache
      for (const name of Object.keys(modules.data({ production: false }))) {
        const data = modules.data({ production: false })[name];
        virtualModuleCache.set(name, getDataHash(data));
      }
      virtualModuleCache.set(
        "routes",
        getDataHash(routes.data({ production: false })),
      );

      // Initialize dependency mappings
      updateDependencyMappings();

      // Start file watcher
      fileWatcher.start();
      server.watcher.on("close", () => fileWatcher.stop());
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

    buildEnd: () => {
      fileWatcher.stop();
    },

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
     * Transforms modules that import virtual modules, adding proper HMR support.
     * @param {string} code - The module's source code.
     * @param {string} id - The module's ID.
     * @returns {object|null} Transformed code with HMR or null if no transformation.
     */
    async transform(
      code: string,
      id: string,
    ): Promise<{ code: string; map: null } | null> {
      // Skip if:
      // 1. This is a virtual module itself
      // 2. No server available (production build)
      // 3. Already has HMR code
      if (
        id.startsWith("\0") ||
        !server ||
        config.command !== "serve" ||
        code.includes("import.meta.hot")
      ) {
        return null;
      }

      try {
        await init;
        const [imports] = parseImports(code);

        // List all virtual module IDs from handlers
        const virtualModuleIds = [
          ...Object.keys(modules.data({ production: false })).map(
            (key) => `virtual:${key}`,
          ),
          "virtual:routes",
        ];

        const importedVirtualIds = imports
          .map((imp) => imp.n)
          .filter(
            (importName) => importName && virtualModuleIds.includes(importName),
          ) as Array<string>;

        if (importedVirtualIds.length > 0) {
          // Collect dependencies for watching
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
              if (file) {
                const absolutePath = path.resolve(config.root, file.slice(1));
                this.addWatchFile(absolutePath);
              }
            });
          });

          // Add proper HMR handling code that won't conflict with other libraries
          const hmrCode = `
// vite-plugin-autoload: HMR handling
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    // Let the module update naturally without custom handling
    // This prevents conflicts with other HMR handlers
  });
}
`;
          return {
            code: code + hmrCode,
            map: null,
          };
        }
      } catch (error) {
        logger.error(`Failed to transform ${id}:`, error);
      }

      return null;
    },

    /**
     * Handles file changes, regenerating handlers and triggering HMR for affected virtual modules.
     * This handles content modifications (not additions/deletions, which are handled by fileWatcher).
     */
    handleHotUpdate({ file, server }) {
      // This handles modifications to existing files
      const normalizedFile = normalizePath(path.resolve(file));

      // Check if the modified file is mapped to a virtual module
      const mapping = fileToExportMap.get(normalizedFile);
      if (!mapping) return;

      const { virtualModule  } = mapping;
      logger.debug(`HMR: File ${normalizedFile} mapped to ${virtualModule}`);

      // Find the affected module node
      const moduleId = `\0${virtualModule}`;
      const moduleNode = server.moduleGraph.getModuleById(moduleId);

      if (!moduleNode) {
        logger.debug(`No module node found for ${moduleId}`);
        return;
      }

      // Invalidate the module and all its importers
      server.moduleGraph.invalidateModule(moduleNode);

      const affectedModules = new Set([moduleNode]);
      moduleNode.importers.forEach((importer) => {
        server.moduleGraph.invalidateModule(importer);
        affectedModules.add(importer);
      });

      logger.info(
        `HMR update triggered by ${file} modification (affecting ${affectedModules.size} modules)`,
      );

      return Array.from(affectedModules);
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
