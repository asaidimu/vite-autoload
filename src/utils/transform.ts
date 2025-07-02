import type {
  ResolvedFile,
  TransformConfig,
  TransformContext,
  BuildContext,
  FileMatchConfig,
} from "../types";
import { ResolvedFiles } from "./resolver";
import { createUriTransformer } from "./uri";

export interface DataProcessorOptions {
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
}

export interface DataProcessor {
  readonly processEntries: (
    entries: ReadonlyArray<ResolvedFiles>,
    context: BuildContext,
  ) => Promise<Record<string, Array<any>>>;
}

export function createDataProcessor(
  options: DataProcessorOptions,
): DataProcessor {
  const { config } = options;
  const uriTransformer = createUriTransformer();
  const configMap = new Map(config.map((c) => [c.name, c]));

  function transformEntry(
    entry: ResolvedFile,
    moduleConfig: TransformConfig<any, any, any>,
    context: BuildContext,
    allData: Record<string, Array<any>>,
  ): any {
    const transformedUri = uriTransformer.transform({
      uri: entry.uri,
      prefix: (moduleConfig.input as FileMatchConfig).prefix,
      production: context.production,
    });

    const transformedEntry = { ...entry, uri: transformedUri };

    if (moduleConfig.transform) {
      const transformContext: TransformContext = {
        data: allData,
        environment: context.environment,
      };

      return moduleConfig.transform(
        transformedEntry as ResolvedFile,
        transformContext,
      );
    }

    return transformedEntry; // Default return if no transform function
  }

  async function processEntries(
    entries: ReadonlyArray<ResolvedFiles>,
    context: BuildContext,
  ): Promise<Record<string, Array<any>>> {
    const result: Record<string, Array<any>> = {};
    const groupedEntries = entries.reduce(
      (acc, cur) => {
        acc[cur.name] = cur.files;
        return acc;
      },
      {} as Record<string, Array<any>>,
    );

    // First pass: transform all entries
    for (const [moduleKey, moduleEntries] of Object.entries(groupedEntries)) {
      const moduleConfig = configMap.get(moduleKey);
      if (!moduleConfig) {
        console.warn(`No TransformConfig found for moduleKey: ${moduleKey}`);
        continue;
      }

      const transformedEntries = await Promise.all(
        moduleEntries.map((entry) =>
          transformEntry(entry, moduleConfig, context, result),
        ),
      );
      result[moduleKey] = transformedEntries;
    }

    // Second pass: apply aggregation functions
    for (const [moduleKey, moduleData] of Object.entries(result)) {
      const moduleConfig = configMap.get(moduleKey);
      if (moduleConfig?.aggregate) {
        const aggregatedData = await moduleConfig.aggregate(moduleData);
        result[moduleKey] = aggregatedData;
      }
    }

    return result;
  }
  return { processEntries };
}
