import type {
  ResolvedFile,
  TransformConfig,
  TransformContext,
  BuildContext,
  FileMatchConfig,
} from "../types";
import { ResolvedFiles } from "./resolver";
import { createUriTransformer } from "./uri";
import { Logger } from "./logger";

export interface DataProcessorOptions {
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  readonly logger?: Logger;
}

export interface DataProcessor {
  readonly processEntries: (
    entries: Record<string, Array<ResolvedFile | any>>,
    context: BuildContext,
  ) => Promise<Record<string, Array<any>>>;
}

export function createDataProcessor(
  options: DataProcessorOptions,
): DataProcessor {
  const { config, logger } = options;
  const uriTransformer = createUriTransformer();
  const configMap = new Map(config.map((c) => [c.name, c]));

  function transformItem(
    item: ResolvedFile | any,
    moduleConfig: TransformConfig<any, any, any>,
    context: BuildContext,
    allData: Record<string, Array<any>>,
  ): any {
    logger?.debug(`Transforming item for module: ${moduleConfig.name}`);
    let processedItem = item;

    // If it's a ResolvedFile, apply URI transformation
    if (
      typeof item === 'object' &&
      item !== null &&
      'uri' in item &&
      'path' in item &&
      'file' in item
    ) {
      const entry = item as ResolvedFile;
      // Only apply prefix if the input was a FileMatchConfig
      let prefix: string | undefined;
      if (
        typeof moduleConfig.input === 'object' &&
        moduleConfig.input !== null &&
        'directory' in moduleConfig.input &&
        'match' in moduleConfig.input
      ) {
        prefix = (moduleConfig.input as FileMatchConfig).prefix;
      }

      const transformedUri = uriTransformer.transform({
        uri: entry.uri,
        prefix: prefix,
        production: context.production,
      });
      processedItem = { ...entry, uri: transformedUri };
      logger?.debug(`Applied URI transformation to item: ${entry.file}`);
    }

    if (moduleConfig.transform) {
      logger?.debug(`Applying custom transform for module: ${moduleConfig.name}`);
      const transformContext: TransformContext = {
        data: allData,
        environment: context.environment,
      };

      return moduleConfig.transform(
        processedItem,
        transformContext,
      );
    }

    logger?.debug(`No custom transform for module: ${moduleConfig.name}, returning processed item.`);
    return processedItem; // Default return if no transform function
  }

  async function processEntries(
    entries: Record<string, Array<ResolvedFile | any>>,
    context: BuildContext,
  ): Promise<Record<string, Array<any>>> {
    logger?.debug(`Processing entries for ${Object.keys(entries).length} modules.`);
    const result: Record<string, Array<any>> = {};

    // First pass: transform all entries
    for (const [moduleKey, moduleItems] of Object.entries(entries)) {
      const moduleConfig = configMap.get(moduleKey);
      if (!moduleConfig) {
        logger?.warn(`No TransformConfig found for moduleKey: ${moduleKey}`);
        continue;
      }

      logger?.debug(`Transforming items for module: ${moduleKey}. Total items: ${moduleItems.length}`);
      const transformedItems = await Promise.all(
        moduleItems.map((item) =>
          transformItem(item, moduleConfig, context, result),
        ),
      );
      result[moduleKey] = transformedItems;
      logger?.debug(`Finished transforming items for module: ${moduleKey}.`);
    }

    // Second pass: apply aggregation functions
    logger?.debug("Applying aggregation functions...");
    for (const [moduleKey, moduleData] of Object.entries(result)) {
      const moduleConfig = configMap.get(moduleKey);
      if (moduleConfig?.aggregate) {
        logger?.debug(`Applying aggregation for module: ${moduleKey}`);
        const aggregatedData = await moduleConfig.aggregate(moduleData);
        result[moduleKey] = aggregatedData;
        logger?.debug(`Aggregation for module ${moduleKey} completed.`);
      }
    }

    logger?.debug("Entry processing completed.");
    return result;
  }
  return { processEntries };
}
