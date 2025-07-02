import { DataSource, TransformConfig } from "../types";
import { Logger } from "./logger";

export interface DataResolverOptions {
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  readonly logger?: Logger;
}

export interface DataResolver {
  readonly initialize: () => Promise<void>;
  readonly getData: (groupName: string) => any | undefined;
  readonly getAllData: () => Record<string, any>;
}

export function createDataResolver(options: DataResolverOptions): DataResolver {
  const { config, logger } = options;
  const dataCache = new Map<string, any>(); // Map<groupName, Data>

  async function initialize(): Promise<void> {
    logger?.debug("Initializing data resolver...");
    dataCache.clear();
    for (const groupConfig of config) {
      // Check if the input is a function (DataSource)
      if (typeof groupConfig.input === 'function') {
        logger?.debug(`Attempting to resolve data for group: ${groupConfig.name}`);
        try {
          const dataSource = groupConfig.input as DataSource<any>;
          const data = await Promise.resolve(dataSource());
          dataCache.set(groupConfig.name, data);
          logger?.debug(`Successfully resolved and cached data for group: ${groupConfig.name}`);
        } catch (error) {
          logger?.error(`Failed to resolve data for group ${groupConfig.name}`, error);
          throw error;
        }
      }
    }
    logger?.debug("Data resolver initialization complete.");
  }

  function getData(groupName: string): any | undefined {
    logger?.debug(`Retrieving data for group: ${groupName}`);
    const data = dataCache.get(groupName);
    if (data) {
      logger?.debug(`Found data for group: ${groupName}`);
    } else {
      logger?.debug(`No data found for group: ${groupName}`);
    }
    return data;
  }

  function getAllData(): Record<string, any> {
    logger?.debug("Retrieving all data from cache.");
    return Object.fromEntries(dataCache);
  }

  return {
    initialize,
    getData,
    getAllData,
  };
}