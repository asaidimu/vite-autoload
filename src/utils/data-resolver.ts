import { DataSource, TransformConfig } from "../types/transform";
import { Logger } from "./logger";

/**
 * Options for creating a data resolver.
 */
export interface DataResolverOptions {
  /** The transformation configurations to resolve data from. */
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  /** Optional logger instance. */
  readonly logger?: Logger;
}

/**
 * Interface for a data resolver that manages and provides access to data sources.
 */
export interface DataResolver {
  /** Initializes the data resolver, loading data from configured sources. */
  readonly initialize: () => Promise<void>;
  /**
   * Retrieves data for a specific group name.
   * @param groupName - The name of the group to retrieve data for.
   * @returns The data for the specified group, or undefined if not found.
   */
  readonly getData: (groupName: string) => any | undefined;
  /**
   * Retrieves all resolved data.
   * @returns A record of all resolved data, keyed by group name.
   */
  readonly getAllData: () => Record<string, any>;
  /**
   * Gets the current version of the data, incremented on each data resolution.
   * @returns The current data version.
   */
  readonly getVersion: () => number;
}

/**
 * Creates a data resolver instance.
 *
 * @param options - The options for the data resolver.
 * @returns A DataResolver instance.
 */
export function createDataResolver(options: DataResolverOptions): DataResolver {
  const { config, logger } = options;
  const dataCache = new Map<string, any>(); // Map<groupName, Data>
  let _version = 0;

  async function initialize(): Promise<void> {
    logger?.debug("Initializing data resolver...");
    dataCache.clear();
    for (const groupConfig of config) {
      // Check if the input is a function (DataSource)
      if (typeof groupConfig.input === "function") {
        logger?.debug(
          `Attempting to resolve data for group: ${groupConfig.name}`,
        );
        try {
          const dataSource = groupConfig.input as DataSource<any>;
          const data = await Promise.resolve(dataSource());
          dataCache.set(groupConfig.name, data);
          _version++;
          logger?.debug(
            `Successfully resolved and cached data for group: ${groupConfig.name}`,
          );
        } catch (error) {
          logger?.error(
            `Failed to resolve data for group ${groupConfig.name}`,
            error,
          );
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
    getVersion: () => _version,
  };
}
