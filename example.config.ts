import { z } from 'zod';
import type { ExtractFunction, PluginOptions } from './src/core/types';

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export default function createAutoloadConfig({ extract }: ConfigOptions): PluginOptions {
  return {
    rootDir: process.cwd(),
    export: {
      types: 'src/app/config/autogen.d.ts'
    },
    sitemap: {
      output: 'sitemap.xml',
      baseUrl: 'https://example.com',
      exclude: ['/admin/*', '/private/*']
    },
    manifest: {
      name: 'My PWA App',
      shortName: 'PWA App',
      description: 'A Progressive Web Application',
      theme_color: '#4a90e2',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }
      ],
      output: 'manifest.webmanifest'
    },
    routes: {
      views: {
        input: {
          directory: 'src/interface/modules',
          match: ['*/*/index.tsx'],
          ignore: ['components/*', 'development/*', ]
        },
        output: {
          name: 'views',
          template: 'export const views = {{ data }};'
        },
        transform: (view) => {
          const route = view.path
            .replace(/.*modules/, '')
            .replace(/\\/g, '/')
            .replace(/\.tsx?$/, '')
            .replace(/index.?$/, '');

          return {
            route: route.length === 1 ? route : route.replace(new RegExp('/?$'), ''),
            path: view.uri,
            module: route.split('/')[0],
            metadata: extract({
              filePath: view.file,
              schema: z.unknown(),
              name: 'metadata'
            })
          };
        }
      },
      pages: {
        input: {
          directory: 'src/interface/pages',
          match: ['*.tsx', '*/index.tsx']
        },
        output: {
          name: 'pages',
          template: 'export const pages = {{ data }};'
        },
        transform: (page) => {
          const route = page.path
            .replace(/.*pages/, '')
            .replace(/\\/g, '/')
            .replace(/\.tsx?$/, '')
            .replace(/index.?$/, '');

          return {
            route: route || '/',
            path: page.uri,
            metadata: extract({
              filePath: page.file,
              schema: z.unknown(),
              name: 'metadata'
            })
          };
        }
      }
    },
    modules: {
      modules: {
        input: {
          directory: 'src/interface/modules',
          match: ['*/module.ts'],
          prefix: '/'
        },
        output: {
          name: 'modules',
          template: ''
        },
        transform: (
          module,
          routes,
        ) => {
          const name = module.path
            .replace(/.*modules./, '')
            .replace(new RegExp('/module.ts$'), '');
          return {
            name,
            path: module.uri,
            views: routes.views.filter((i: any) => i.module === name),
            metadata: extract({
              filePath: module.file,
              schema: z.unknown(),
              name: 'default'
            })
          };
        }
      },
      layouts: {
        input: {
          directory: 'src/interface/layouts',
          match: ["*.tsx", "*/index.tsx"],
          ignore: []
        },
        output: {
          name: 'layouts',
          template: 'export const layouts = {{ data }};'
        },
        transform(layout) {
          const name = layout.path
            .replace(/.*layouts./, "")
            .replace(/(.index)?\.tsx$/, "");
          return {
            path: layout.uri,
            name,
          };
        }
      },
      models: {
        input: {
          directory: 'src/app/models',
          match: ['**/*.ts'],
          ignore: []
        },
        output: {
          name: 'models',
          template: 'export const models = {{ data }};'
        },
        transform(model) {
          return {
            path: model.uri,
            module: model.path.split('/').pop()?.replace(/\.ts$/, '') || ''
          };
        }
      },
      config: {
        input: {
          directory: 'src/app/config',
          match: ['**/index.ts'],
          ignore: []
        },
        output: {
          name: 'config',
          template: 'export const config = {{ data }};'
        },
        transform(config) {
          return {
            path: config.uri,
            module: config.path.split('/').pop()?.replace(/\.ts$/, '') || ''
          };
        }
      }
    },
    logLevel: 'info'
  };
}