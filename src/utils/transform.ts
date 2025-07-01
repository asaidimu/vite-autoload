import type {
  ResolvedFile,
  TransformConfig,
  TransformContext,
  BuildContext,
  FileMatchConfig,
} from "../types";
import { createUriTransformer } from "./uri";

export interface DataProcessorOptions {
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
}

export interface DataProcessor {
  readonly processEntries: (
    entries: ReadonlyArray<ResolvedFile>,
    context: BuildContext,
  ) => Record<string, Array<any>>;
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
    const { module, ...fileData } = entry as any; // TODO: that pesky `module`

    const transformedUri = uriTransformer.transform({
      uri: entry.uri,
      prefix: (moduleConfig.input as FileMatchConfig).prefix,
      production: context.production,
    });

    const transformedEntry = { ...fileData, uri: transformedUri };

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

  function groupEntriesByModule(
    entries: ReadonlyArray<ResolvedFile>,
  ): Record<string, ResolvedFile[]> {
    return entries.reduce(
      // TODO: pesky module again
      (groups, entry: any) => {
        if (!groups[entry.module]) {
          groups[entry.module] = [];
        }
        groups[entry.module].push(entry);
        return groups;
      },
      {} as Record<string, ResolvedFile[]>,
    );
  }

  function processEntries(
    entries: ReadonlyArray<ResolvedFile>,
    context: BuildContext,
  ): Record<string, Array<any>> {
    const result: Record<string, Array<any>> = {};
    const groupedEntries = groupEntriesByModule(entries);

    // First pass: transform all entries
    for (const [moduleKey, moduleEntries] of Object.entries(groupedEntries)) {
      const moduleConfig = configMap.get(moduleKey);
      if (!moduleConfig) {
        console.warn(`No TransformConfig found for moduleKey: ${moduleKey}`);
        continue;
      }

      result[moduleKey] = moduleEntries.map((entry) =>
        transformEntry(entry, moduleConfig, context, result),
      );
    }

    // Second pass: apply aggregation functions
    for (const [moduleKey, moduleData] of Object.entries(result)) {
      const moduleConfig = configMap.get(moduleKey);
      if (moduleConfig?.aggregate) {
        const aggregatedData = moduleConfig.aggregate(moduleData);
        result[moduleKey] = aggregatedData;
      }
    }

    return result;
  }
  return { processEntries };
}
