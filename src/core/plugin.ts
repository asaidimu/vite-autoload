import path from 'path';
import type { Plugin, ResolvedConfig } from 'vite';
import { createModuleGenerator } from '../generators/module-generator';
import { generateSitemap, type SitemapEntry } from '../generators/sitemap-generator';
import { generateTypes } from '../generators/types-generator';
import { generateManifest } from '../generators/manifest-generator';
import { createFileWatcher } from '../watchers/file-watcher';
import { createLogger } from './logger';
import type { FileExportMap, PluginOptions, RouteData, VirtualModule } from './types';

export function createAutoloadPlugin(options: PluginOptions): Plugin {

    const logger = createLogger(options.logLevel);
    // Use Map to store file exports
    const fileToExportMap = new Map<string, FileExportMap>();

    let config: ResolvedConfig;

    const modules = createModuleGenerator({
        name: 'modules',
        config: options.modules,
    });

    const routes = createModuleGenerator({
        name: 'routes',
        config: options.routes as any,
    });

    const handlers = [modules, routes] as const;

    const fileWatcher = createFileWatcher(
        options,
        logger,
        async () => {
            if (!options.export?.types) return;

            try {
                const output = path.join(
                    options.rootDir || process.cwd(),
                    options.export.types
                );

                // Get route limit from config or use default
                const routeLimit = options.export?.routeLimit || 1000;

                // Limit the amount of data processed at once
                const routeData = routes.data({ production: false }) as Record<string, RouteData>;
                const types: Record<string, string[]> = {
                    ApplicationRoute: Object.values(routeData)
                        .flat()
                        .filter((r) => !!r?.route)
                        .slice(0, routeLimit) // Use configured route limit
                        .map(r => r.route)
                };

                for (const [key, value] of Object.entries(
                    modules.data({ production: false }),
                )) {
                    const type = options.modules[key]?.output?.types;
                    if (type) {
                        const { name, key: prop } = type;
                        types[name] = (value as Array<any>).map((m) => m[prop]);
                    }
                }

                await generateTypes(output, types);
                logger.info(`Types generated successfully (processed ${types.ApplicationRoute.length} routes)`);
            } catch (error) {
                logger.error('Failed to generate types:', error);
            }
        }
    );

    return {
        name: 'vite-plugin-autoload',

        configResolved: (resolvedConfig: ResolvedConfig) => {
            config = resolvedConfig;
        },

        configureServer: (server) => {
            const routeData = routes.data({ production: false });
            const chunkSize = options.chunkSize || 100;

            type RouteEntry = { path: string };

            const mapRoutes = (
                entries: RouteEntry[],
                virtualModule: VirtualModule,
                exportKey: string
            ) => {
                // Process entries in chunks to prevent memory spikes
                for (let i = 0; i < entries.length; i += chunkSize) {
                    const chunk = entries.slice(i, i + chunkSize);
                    chunk.forEach((entry, index) => {
                        if (entry?.path) {
                            fileToExportMap.set(entry.path, {
                                virtualModule,
                                exportKey,
                                index: i + index
                            });
                        }
                    });
                }
            };

            if (Array.isArray(routeData.views)) {
                mapRoutes(routeData.views, 'virtual:routes', 'views');
            }

            if (Array.isArray(routeData.pages)) {
                mapRoutes(routeData.pages, 'virtual:routes', 'pages');
            }
        },

        async buildStart() {
            if (config.isProduction) {
                const routeData = routes.data({ production: true }) as Record<string, RouteData>;
                const emit = this.emitFile.bind(this);
                const d = handlers.map((g) => g.modules({ production: true })).flat();

                d.forEach((element) => {
                    emit({
                        type: "chunk",
                        id: element.file,
                        preserveSignature: "exports-only",
                        fileName: element.uri.replace(new RegExp("^\/"), ""),
                    });
                });

                if (options.sitemap) {
                    const { baseUrl, exclude = [] } = options.sitemap;
                    const sitemapEntries: SitemapEntry[] = Object.values(routeData)
                        .flat()
                        .filter((r): r is RouteData => !!r?.route)
                        .map(route => ({
                            route: route.route,
                            metadata: route.metadata
                        }));

                    const sitemap = generateSitemap(
                        sitemapEntries,
                        baseUrl,
                        exclude
                    );

                    this.emitFile({
                        type: 'asset',
                        fileName: 'sitemap.xml',
                        source: sitemap
                    });
                }
            }

            if (config.command === 'serve') {
                fileWatcher.start();
            }
        },

        buildEnd: () => {
            fileWatcher.stop();
        },

        resolveId(id: string) {
            const name = id.replace('virtual:', '');
            const found = handlers.find((g) => g.find(name));
            if (found) {
                return `\0${id}`;
            }
            return null;
        },

        async load(id: string) {
            const name = id.replace('\0virtual:', '');

            if (modules.find(name)) {
                const code = modules.code({
                    production: config.isProduction,
                    name,
                }) as string;

                return code;
            }

            if (name === 'routes') {
                const code = routes.code({
                    production: config.isProduction,
                }) as string;
                return code;
            }

            return null;
        },

        transformIndexHtml(html) {
            // Only inject manifest link if manifest is configured
            if (options.manifest) {
                const manifestPath = options.manifest.output || 'manifest.webmanifest';
                return {
                    html,
                    tags: [
                        {
                            tag: 'link',
                            attrs: {
                                rel: 'manifest',
                                href: '/' + manifestPath
                            },
                            injectTo: 'head'
                        }
                    ]
                };
            }
            return html;
        },

        async closeBundle() {
            if (options.manifest) {
                // Generate manifest file in the build output directory
                generateManifest(options.manifest, config.build.outDir);
            }

            if (options.sitemap && config.isProduction) {
                const { baseUrl, exclude = [] } = options.sitemap;
                const routeData = routes.data({ production: true }) as Record<string, RouteData>;
                const sitemapEntries: SitemapEntry[] = Object.values(routeData)
                    .flat()
                    .filter((r): r is RouteData => !!r?.route)
                    .map(route => ({
                        route: route.route,
                        metadata: route.metadata
                    }));

                const sitemap = generateSitemap(
                    sitemapEntries,
                    baseUrl,
                    exclude
                );

                this.emitFile({
                    type: 'asset',
                    fileName: 'sitemap.xml',
                    source: sitemap
                });
            }
        }
    };
}
