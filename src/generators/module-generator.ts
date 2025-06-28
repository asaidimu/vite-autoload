import type {
  ResolvedRouteModule,
  RouteData,
  TransformConfig,
} from "../core/types";
import { resolve } from "../utils/resolver";
import { generateMd5Hash } from "../utils/crypto";

interface GeneratorOptions {
  name: string;
  config: Record<string, TransformConfig<any, any, any>>;
}

export function createModuleGenerator(options: GeneratorOptions) {
  const cache = new Map<string, ResolvedRouteModule & { module: string }>();

  const name = options.name;
  const config = options.config;

  function init() {
    for (const [key, value] of Object.entries(options.config)) {
      const { data: _, ...config } = value.input;
      const resolved = resolve(config);
      for (const entry of resolved) {
        cache.set(entry.file, { ...entry, module: key });
      }
    }
  }

  init();

  type Mutable<T> = {
    -readonly [key in keyof T]: T[key];
  };

  function modules({ production }: { production: boolean }) {
    const data = Array.from(cache.values()).reduce(
      (acc, value) => {
        const result: Mutable<typeof value> = structuredClone(value);
        if (production) {
          result.uri = `${config[value.module].input.prefix || "/"}${generateMd5Hash(result.uri)}.js`;
        } else {
          result.uri = `${config[value.module].input.prefix || "/"}${result.uri}`;
        }

        acc.push(result);
        return acc;
      },
      [] as Array<ResolvedRouteModule & { module: string }>,
    );
    return data;
  }

  function data({ production }: { production: boolean }) {
    const routeData = Array.from(cache.values()).reduce(
      (acc, current) => {
        const { module, ...value } = current;
        if (!acc[module]) {
          acc[module] = [];
        }
        let result = structuredClone(value);
        if (production) {
          result.uri = `${config[module].input.prefix || "/"}${generateMd5Hash(result.uri)}.js`;
        } else {
          result.uri = `${config[module].input.prefix || "/"}${result.uri}`;
        }
        if (config[module].transform) {
          const context =
            name === "modules" ? { views: acc.views || [] } : { views: [] };
          result = config[module].transform(result, context);
        }
        acc[module].push(result as any);
        return acc;
      },
      {} as Record<string, Array<RouteData>>,
    );

    // Apply aggregate function if available
    for (const module of Object.keys(routeData)) {
      if (config[module].aggregate) {
        routeData[module] = config[module].aggregate(routeData[module]);
      }
    }

    return routeData;
  }

  function code(params: {
    production: boolean;
    name?: string;
    split?: boolean;
  }): string | Record<string, string> {
    const values = data(params);
    const write = (a: object) =>
      Object.entries(a).reduce((code, [k, v]) => {
        const template =
          config[k]?.output?.template ||
          `export const ${k} = {{ data }};\nexport default ${k};`;
        const s = template.replace(
          "{{ data }}",
          JSON.stringify(v, undefined, 4),
        );
        return code + s + "\n";
      }, "");

    if (params.name) {
      const value = values[params.name];
      return write({ [params.name]: value });
    }

    if (params.split) {
      return Object.fromEntries(
        Object.entries(values).map(([key, value]) => {
          return [key, write({ [key]: value })];
        }),
      );
    }

    return write(values);
  }

  function match(file: string): boolean {
    return cache.has(file);
  }

  function add(file: string): void {
    console.log(`Added file: ${file} to ${name}`);
  }

  function remove(file: string): void {
    cache.delete(file);
  }

  function find(searchName: string): boolean {
    const n = Object.keys(config).find((i) => i === searchName);
    return Boolean(n) || searchName === name;
  }

  return {
    name,
    config,
    modules,
    data,
    code,
    match,
    add,
    remove,
    find,
  };
}
