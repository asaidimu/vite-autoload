import { GeneratorDefinition, ResolvedFile } from "./types";

/**
 * Default generator for routes - handles views and pages
 */
export const defaultRoutesGenerator: GeneratorDefinition = {
  name: "routes",
  virtualId: "virtual:routes",

  dataExtractor: (data: any,_:boolean) => {
    // Data comes from the internal module generator
    return data;
  },

  codeGenerator: (data: Record<string, any[]>, _: boolean) => {
    const { views = [], pages = [] } = data;
    const chunkSize = 100; // Could be configurable

    const generateChunks = (items: any[], type: string) => {
      const chunks = [];
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        chunks.push(`const ${type}Chunk${Math.floor(i / chunkSize)} = ${JSON.stringify(chunk, null, 2)};`);
      }
      return chunks;
    };

    const viewChunks = generateChunks(views, 'views');
    const pageChunks = generateChunks(pages, 'pages');

    const viewsExport = views.length > 0
      ? `[${Array.from({ length: Math.ceil(views.length / chunkSize) }, (_, i) => `...viewsChunk${i}`).join(', ')}]`
      : '[]';

    const pagesExport = pages.length > 0
      ? `[${Array.from({ length: Math.ceil(pages.length / chunkSize) }, (_, i) => `...pagesChunk${i}`).join(', ')}]`
      : '[]';

    return `
${viewChunks.join('\n')}
${pageChunks.join('\n')}

export const views = ${viewsExport};
export const pages = ${pagesExport};
export default { views, pages };
`.trim();
  },

  moduleResolver: (data: Record<string, any[]>, _: boolean) => {
    const modules: ResolvedFile[] = [];

    Object.values(data).flat().forEach((item: any) => {
      if (item && typeof item === 'object' && item.path && item.uri && item.file) {
        modules.push({
          path: item.path,
          uri: item.uri,
          file: item.file
        });
      }
    });

    return modules;
  },

  typesExtractor: (data: Record<string, any[]>) => {
    const routes = Object.values(data)
      .flat()
      .filter((item: any) => item && item.route)
      .map((item: any) => item.route);

    return {
      ApplicationRoute: routes
    };
  },

  sitemapExtractor: (data: Record<string, any[]>) => {
    return Object.values(data)
      .flat()
      .filter((item: any) => item && item.route)
      .map((item: any) => ({
        route: item.route,
        metadata: item.metadata
      }));
  }
};

/**
 * Default generator for modules - handles any key-value module config
 */
export const createDefaultModuleGenerator = (key: string): GeneratorDefinition => ({
  name: key,
  virtualId: `virtual:${key}`,

  dataExtractor: (data: any, _: boolean) => {
    return data;
  },

  codeGenerator: (data: Record<string, any[]>, _: boolean) => {
    const items = data[key] || [];
    const chunkSize = 100;

    const chunks = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      chunks.push(`const chunk${Math.floor(i / chunkSize)} = ${JSON.stringify(chunk, null, 2)};`);
    }

    const itemsExport = items.length > 0
      ? `[${Array.from({ length: Math.ceil(items.length / chunkSize) }, (_, i) => `...chunk${i}`).join(', ')}]`
      : '[]';

    return `
${chunks.join('\n')}

export const ${key} = ${itemsExport};
export default ${key};
`.trim();
  },

  moduleResolver: (data: Record<string, any[]>, _: boolean) => {
    const items = data[key] || [];
    const modules: ResolvedFile[] = [];

    items.forEach((item: any) => {
      if (item && typeof item === 'object' && item.path && item.uri && item.file) {
        modules.push({
          path: item.path,
          uri: item.uri,
          file: item.file
        });
      }
    });

    return modules;
  },

  typesExtractor: (_: Record<string, any[]>) => {
    return {};
  }
});

/**
 * Helper to create a custom generator that extends the default behavior
 */
export const createCustomGenerator = (
  base: GeneratorDefinition,
  overrides: Partial<GeneratorDefinition>
): GeneratorDefinition => ({
  ...base,
  ...overrides,
});

/**
 * Exported defaults for user convenience
 */
export const generators = {
  routes: defaultRoutesGenerator,
  createModule: createDefaultModuleGenerator,
  createCustom: createCustomGenerator,
};
