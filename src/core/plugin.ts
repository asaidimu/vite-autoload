import path from "path";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";
import { createModuleGenerator } from "../generators/module-generator";
import { generateSitemap } from "../generators/sitemap-generator";
import { generateTypes } from "../generators/types-generator";
import { generateManifest } from "../generators/manifest-generator";
import { createFileWatcher } from "../watchers/file-watcher";
import { createLogger } from "./logger";
import { PluginOptions, GeneratorDefinition } from "./types";
import { defaultRoutesGenerator, createDefaultModuleGenerator } from "./generators";
import { init, parse as parseImports } from "es-module-lexer";
import { normalizePath } from "vite";
import { isJavaScriptLikeModule } from "../utils/checkers";

/**
 * Internal wrapper that combines the legacy module generator with the new generator system
 */
interface InternalGenerator {
  name: string;
  virtualId: string;
  generator: GeneratorDefinition;
  legacyGenerator: any; // The createModuleGenerator result
}

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

  // Maps importer modules to their virtual module dependencies
  const importerToVirtualDeps = new Map<string, Set<string>>();

  // Maps virtual modules to their file dependencies
  const virtualModuleDeps = new Map<string, Set<string>>();

  // Store resolved Vite config and dev server instance
  let config: ResolvedConfig;
  let server: ViteDevServer;

  // Create internal generators from config
  const internalGenerators: InternalGenerator[] = [];

  // Setup routes generator
  const routesGenerator = options.routes.generator || defaultRoutesGenerator;
  const routesLegacyGenerator = createModuleGenerator({
    name: "routes",
    config: options.routes as any,
  });

  internalGenerators.push({
    name: "routes",
    virtualId: routesGenerator.virtualId || "virtual:routes",
    generator: routesGenerator,
    legacyGenerator: routesLegacyGenerator
  });

  // Setup module generators
  Object.entries(options.modules).forEach(([key, moduleConfig]) => {
    const generator = moduleConfig.generator || createDefaultModuleGenerator(key);
    const legacyGenerator = createModuleGenerator({
      name: key,
      config: moduleConfig as any,
    });

    internalGenerators.push({
      name: key,
      virtualId: generator.virtualId || `virtual:${key}`,
      generator,
      legacyGenerator
    });
  });

  /**
   * Calculates a hash for module data to detect changes
   */
  const getDataHash = (data: any): string => {
    return JSON.stringify(data);
  };

  /**
   * Detects if a virtual module's data has changed
   */
  const hasVirtualModuleChanged = (internalGen: InternalGenerator): boolean => {
    const currentData = internalGen.legacyGenerator.data({ production: false });
    const extractedData = internalGen.generator.dataExtractor(currentData, false);
    const currentHash = getDataHash(extractedData);
    const previousHash = virtualModuleCache.get(internalGen.name);

    const hasChanged = previousHash !== currentHash;
    if (hasChanged) {
      virtualModuleCache.set(internalGen.name, currentHash);
      logger.debug(`Virtual module ${internalGen.name} has changed`);
    }
    return hasChanged;
  };

  /**
   * Updates dependencies and virtual module mappings after filesystem changes
   */
  const updateDependencyMappings = () => {
    logger.debug("Updating dependency mappings");
    fileToExportMap.clear();
    virtualModuleDeps.clear();

    const chunkSize = options.chunkSize || 100;

    // Helper to map entries to their virtual modules
    const mapEntries = (
      entries: Array<any>,
      virtualModule: string,
      exportKey: string,
    ) => {
      const deps = new Set<string>();
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
            // Store absolute path for dependency tracking
            const absolutePath = path.resolve(config?.root || process.cwd(), entry.path.slice(1));
            deps.add(absolutePath);
          }
        });
      }
      virtualModuleDeps.set(virtualModule, deps);
    };

    // Process all generators
    internalGenerators.forEach(internalGen => {
      const rawData = internalGen.legacyGenerator.data({ production: false });
      const extractedData = internalGen.generator.dataExtractor(rawData, false);

      // Map dependencies for each data array in the extracted data
      Object.entries(extractedData).forEach(([exportKey, entries]) => {
        if (Array.isArray(entries)) {
          mapEntries(entries, internalGen.virtualId, exportKey);
        }
      });
    });

    logger.debug("Updated virtual module dependencies:", Array.from(virtualModuleDeps.keys()));
  };

  /**
   * Establishes direct dependencies between an importer and all files in virtual modules it imports
   */
  const establishDirectDependencies = (importerId: string, virtualModuleIds: string[]) => {
    if (!server) return;

    // Track which virtual modules this importer depends on
    if (!importerToVirtualDeps.has(importerId)) {
      importerToVirtualDeps.set(importerId, new Set());
    }

    const importerVirtualDeps = importerToVirtualDeps.get(importerId)!;

    virtualModuleIds.forEach(virtualId => {
      importerVirtualDeps.add(virtualId);

      // Get all file dependencies for this virtual module
      const fileDeps = virtualModuleDeps.get(virtualId);
      if (!fileDeps) return;
    });

    logger.debug(`Established dependencies for ${importerId}:`, Array.from(importerVirtualDeps));
  };

     const fileWatcher = createFileWatcher(
    options,
    logger,
    async (changedFiles) => {
      if (!server && !config.isProduction) return;

      logger.debug(`Files changed: ${changedFiles.join(", ")}`);

      // Detect which virtual modules need updates
      const changedVirtualModules = new Set<string>();

      // Check each generator for changes
      internalGenerators.forEach(internalGen => {
        if (hasVirtualModuleChanged(internalGen)) {
          changedVirtualModules.add(internalGen.virtualId);
        }
      });

      // Update dependency mappings
      updateDependencyMappings();

      // Trigger HMR and type generation ONLY if virtual module content has changed
      if (changedVirtualModules.size > 0) {
        // HMR updates in development mode
        if (server) {
          const moduleGraph = server.moduleGraph;

          for (const moduleName of changedVirtualModules) {
            const virtualId = `\0${moduleName}`;
            const mod = moduleGraph.getModuleById(virtualId);

            if (mod) {
              moduleGraph.invalidateModule(mod);
              const affectedModules = new Set([mod]);

              mod.importers.forEach((importer) => {
                moduleGraph.invalidateModule(importer);
                affectedModules.add(importer);
              });

              if (affectedModules.size > 0) {
                logger.info(
                  `Sending HMR update for ${moduleName} structure change (affecting ${affectedModules.size} modules)`,
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

        // Generate types only when there's a change
        if (options.export?.types) {
          try {
            const output = path.join(
              options.rootDir || process.cwd(),
              options.export.types,
            );
            const routeLimit = options.export?.routeLimit || 1000;

            const types: Record<string, string[]> = {};

            internalGenerators.forEach(internalGen => {
              if (internalGen.generator.typesExtractor) {
                const rawData = internalGen.legacyGenerator.data({ production: false });
                const extractedData = internalGen.generator.dataExtractor(rawData, false);
                const generatorTypes = internalGen.generator.typesExtractor(extractedData);
                Object.assign(types, generatorTypes);
              }
            });

            if (types.ApplicationRoute) {
              types.ApplicationRoute = types.ApplicationRoute.slice(0, routeLimit);
            }

            await generateTypes(output, types);
            logger.info(
              `Types generated successfully (processed ${types.ApplicationRoute?.length || 0} routes)`,
            );
          } catch (error) {
            logger.error("Failed to generate types:", error);
          }
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
      internalGenerators.forEach(internalGen => {
        const rawData = internalGen.legacyGenerator.data({ production: false });
        const extractedData = internalGen.generator.dataExtractor(rawData, false);
        virtualModuleCache.set(internalGen.name, getDataHash(extractedData));
      });

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

        internalGenerators.forEach(internalGen => {
          const rawData = internalGen.legacyGenerator.data({ production: true });
          const extractedData = internalGen.generator.dataExtractor(rawData, true);
          const moduleFiles = internalGen.generator.moduleResolver(extractedData, true);

          moduleFiles.forEach((element) => {
            emit({
              type: "chunk",
              id: element.file,
              preserveSignature: "exports-only",
              fileName: element.uri.replace(/^\/+/g, ""),
            });
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
      const found = internalGenerators.find(gen => gen.virtualId === id);
      if (found) return `\0${id}`;
      return null;
    },

    /**
     * Loads the content of virtual modules based on their name.
     * @param {string} id - The resolved module ID.
     * @returns {string|null} The generated module code or null if not found.
     */
    async load(id: string): Promise<string | null> {
      const virtualId = id.replace("\0", "");
      const internalGen = internalGenerators.find(gen => gen.virtualId === virtualId);

      if (internalGen) {
        const rawData = internalGen.legacyGenerator.data({ production: config.isProduction });
        const extractedData = internalGen.generator.dataExtractor(rawData, config.isProduction);
        return internalGen.generator.codeGenerator(extractedData, config.isProduction);
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
     * Transforms modules that import virtual modules, establishing direct dependencies
     * for proper HMR behavior.
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
        code.includes("// vite-plugin-autoload: HMR handling") ||
        !isJavaScriptLikeModule(id)
      ) {
        return null;
      }

      try {
        await init;
        const [imports] = parseImports(code);

        // List all virtual module IDs from generators
        const virtualModuleIds = internalGenerators.map(gen => gen.virtualId);

        const importedVirtualIds = imports
          .map((imp) => imp.n)
          .filter(
            (importName) => importName && virtualModuleIds.includes(importName),
          ) as Array<string>;

        if (importedVirtualIds.length > 0) {
          logger.debug(`Module ${id} imports virtual modules:`, importedVirtualIds);

          // Establish direct dependencies
          establishDirectDependencies(id, importedVirtualIds);

          // Add watch files for all dependencies of the imported virtual modules
          importedVirtualIds.forEach((virtualId) => {
            const fileDeps = virtualModuleDeps.get(virtualId);
            if (fileDeps) {
              fileDeps.forEach((filePath) => {
                this.addWatchFile(filePath);
                logger.debug(`Added watch file: ${filePath} for importer: ${id}`);
              });
            }
          });

          // Add minimal HMR code that doesn't interfere with natural HMR
          const hmrCode = `
// vite-plugin-autoload: HMR handling
if (import.meta.hot) {
  // Accept updates to this module - let Vite handle the rest
  import.meta.hot.accept(() => {
    // Natural HMR will reload this module when its dependencies change
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
     * Handles file changes for route modules, ensuring they trigger HMR for their importers
     * without invalidating the virtual module itself.
     */
    handleHotUpdate({ file, server }) {
      const normalizedFile = normalizePath(path.resolve(file));
      logger.debug(`handleHotUpdate: Processing file change: ${normalizedFile}`);

      // Check if this file is a dependency of any virtual module
      const mapping = fileToExportMap.get(normalizedFile);
      if (!mapping) {
        logger.debug(`File ${normalizedFile} is not tracked by any virtual module`);
        return;
      }

      logger.debug(`File ${normalizedFile} is tracked by virtual module: ${mapping.virtualModule}`);

      // Find all modules that import virtual modules containing this file
      const affectedModules = new Set();

      for (const [importerId, virtualDeps] of importerToVirtualDeps.entries()) {
        if (virtualDeps.has(mapping.virtualModule)) {
          const importerModule = server.moduleGraph.getModuleById(importerId);
          if (importerModule) {
            logger.debug(`Adding affected importer: ${importerId}`);
            affectedModules.add(importerModule);

            // Also invalidate the importer module
            server.moduleGraph.invalidateModule(importerModule);
          }
        }
      }

      if (affectedModules.size > 0) {
        logger.info(
          `HMR: File ${path.basename(file)} changed, updating ${affectedModules.size} importer modules (bypassing virtual module)`
        );

        // Return the affected modules for Vite to handle the HMR update
        return Array.from(affectedModules) as any;
      }

      logger.debug(`No affected modules found for file: ${normalizedFile}`);
      return;
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

        // Collect sitemap entries from all generators that support it
        const sitemapEntries: Array<{ route: string; metadata?: any }> = [];

        internalGenerators.forEach(internalGen => {
          if (internalGen.generator.sitemapExtractor) {
            const rawData = internalGen.legacyGenerator.data({ production: true });
            const extractedData = internalGen.generator.dataExtractor(rawData, true);
            const generatorSitemapEntries = internalGen.generator.sitemapExtractor(extractedData);
            sitemapEntries.push(...generatorSitemapEntries);
          }
        });

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
