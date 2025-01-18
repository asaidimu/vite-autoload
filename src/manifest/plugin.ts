import type { Plugin } from 'vite';
import { ManifestGenerator } from './generator';
import { ManifestConfigSchema } from './types';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

export interface ManifestPluginOptions {
  app?: {
    manifest?: z.infer<typeof ManifestConfigSchema>;
    baseUrl?: string;
  };
}

export function manifestPlugin(options?: ManifestPluginOptions): Plugin {
  let manifestGenerator: ManifestGenerator;
  const manifestConfig = options?.app?.manifest ?? {};
  const baseUrl = options?.app?.baseUrl ?? 'http://localhost:3000';

  return {
    name: 'vite-autoload:manifest',
    
    configResolved(config) {
      manifestGenerator = new ManifestGenerator(
        {
          output: path.join(config.build.outDir, 'manifest.json'),
          format: 'json',
          compression: true,
          validation: true,
          ...manifestConfig
        },
        config.root,
        baseUrl
      );
    },

    async buildStart() {
      // Start dev server for dynamic analysis if not in production
      if (process.env.NODE_ENV !== 'production') {
        // Dev server is handled by Vite automatically
      }
    },

    async buildEnd() {
      await manifestGenerator.dispose();
    },

    async generateBundle(_, bundle) {
      // Add all emitted assets to the manifest
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset') {
          const content = Buffer.from(asset.source);
          manifestGenerator.addAsset(
            fileName,
            content,
            path.extname(fileName).slice(1) || 'unknown',
            []  // Dependencies would be populated from module graph
          );
        }
      }

      // Analyze routes
      const routes = Object.keys(bundle).filter(
        name => name.endsWith('.html') || name.endsWith('.js')
      );

      for (const route of routes) {
        await manifestGenerator.analyzeRoute(
          '/' + route.replace(/\.(html|js)$/, ''),
          route
        );
      }

      // Generate the manifest file
      const manifestContent = await manifestGenerator.serialize();
      const outputPath = manifestConfig.output ?? 'manifest.json';
      
      await fs.writeFile(outputPath, manifestContent, 'utf-8');
    },

    // Hook into HMR for development
    handleHotUpdate({ file, server }) {
      if (manifestConfig.validation) {
        // Re-validate manifest when files change
        try {
          manifestGenerator.validate();
        } catch (error) {
          server.ws.send({
            type: 'error',
            err: {
              message: `Manifest validation error: ${error.message}`,
              stack: error.stack
            }
          });
        }
      }
    }
  };
}
