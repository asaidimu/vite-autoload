import type { Logger } from '../core/logger';
import type {
  PluginOptions,
  ResolvedRouteModule,
  RouteData,
  BuildContext,
  RouteGeneratorResult
} from '../core/types';
import { generateMd5Hash } from '../utils/hash';
import { resolve } from '../utils/resolver';

interface RouteCache {
  [key: string]: ResolvedRouteModule & { module: string };
}

interface RouteGeneratorApi {
  readonly getData: (context: BuildContext) => RouteGeneratorResult;
  readonly getCode: (context: BuildContext) => string | Record<string, string>;
  readonly hasFile: (file: string) => boolean;
  readonly addFile: (file: string) => void;
  readonly removeFile: (file: string) => void;
}

export function createRouteGenerator(
  options: PluginOptions,
  logger: Logger
): RouteGeneratorApi {
  const cache: RouteCache = {};

  function initialize(): void {
    try {
      const { views, pages } = options.routes;

      // Initialize views
      const viewsResolved = resolve(views.input);
      viewsResolved.forEach(entry => {
        cache[entry.file] = { ...entry, module: 'views' };
      });

      // Initialize pages
      const pagesResolved = resolve(pages.input);
      pagesResolved.forEach(entry => {
        cache[entry.file] = { ...entry, module: 'pages' };
      });

      logger.debug(`Initialized ${Object.keys(cache).length} routes`);
    } catch (error) {
      logger.error('Failed to initialize routes', error);
      throw error;
    }
  }

  function getModules({ production }: { production: boolean }): ReadonlyArray<ResolvedRouteModule & { module: string }> {
    return Object.values(cache).map(value => {
      const result = { ...value };
      const config = options.routes[value.module as keyof typeof options.routes];

      if (production) {
        result.uri = `${config.input.prefix || '/'}${generateMd5Hash(result.uri)}.js`;
      } else {
        result.uri = `${config.input.prefix || '/'}${result.uri}`;
      }

      return result;
    });
  }

  function getData(context: BuildContext): RouteGeneratorResult {
    const { production } = context;
    const modules = getModules({ production });

    return modules.reduce((acc, current) => {
      const { module, ...value } = current;

      if (!acc[module as keyof RouteGeneratorResult]) {
        (acc[module as keyof RouteGeneratorResult] as RouteData[]) = [];
      }

      const config = options.routes[module as keyof typeof options.routes];
      let result: RouteData = value as unknown as RouteData;

      if (config?.transform) {
        result = config.transform(value, { views: [] }) as RouteData;
      }

      (acc[module as keyof RouteGeneratorResult] as RouteData[])?.push(result);
      return acc;
    }, {} as RouteGeneratorResult);
  }

  function getCode(context: BuildContext): string | Record<string, string> {
    const values = getData(context);

    const write = (data: object): string =>
      Object.entries(data).reduce((code, [k, v]) => {
        return code + `export const ${k} = ${JSON.stringify(v, null, 2)};\n`;
      }, '');

    if (context.name) {
      const value = values[context.name as keyof RouteGeneratorResult];
      return write({ [context.name]: value });
    }

    if (context.split) {
      return Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          write({ [key]: value })
        ])
      );
    }

    return write(values);
  }

  function hasFile(file: string): boolean {
    return file in cache;
  }

  function addFile(file: string): void {
    logger.debug(`Adding file to routes: ${file}`);
    initialize();
  }

  function removeFile(file: string): void {
    logger.debug(`Removing file from routes: ${file}`);
    delete cache[file];
  }

  // Initialize on creation
  initialize();

  return {
    getData,
    getCode,
    hasFile,
    addFile,
    removeFile
  };
}
