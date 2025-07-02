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
    dataCache.clear();
    for (const groupConfig of config) {
      // Check if the input is a function (DataSource)
      if (typeof groupConfig.input === 'function') {
        try {
          const dataSource = groupConfig.input as DataSource<any>;
          const data = await Promise.resolve(dataSource());
          dataCache.set(groupConfig.name, data);
          logger?.debug(`Resolved data for group ${groupConfig.name}`);
        } catch (error) {
          logger?.error(`Failed to resolve data for group ${groupConfig.name}`, error);
          throw error;
        }
      }
    }
  }

  function getData(groupName: string): any | undefined {
    return dataCache.get(groupName);
  }

  function getAllData(): Record<string, any> {
    return Object.fromEntries(dataCache);
  }

  return {
    initialize,
    getData,
    getAllData,
  };
}
