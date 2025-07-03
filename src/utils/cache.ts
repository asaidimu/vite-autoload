import { Logger } from "./logger";

export interface CacheManager<T> {
  readonly size: number;
  readonly clear: () => void;
  readonly set: (key: string, entry: T) => void;
  readonly get: (key: string) => T | undefined;
  readonly has: (key: string) => boolean;
  readonly delete: (key: string) => boolean;
  readonly values: () => IterableIterator<T>;
  readonly entries: () => IterableIterator<[string, T]>;
}

/**
 * Creates a cache manager instance.
 *
 * @template T The type of values stored in the cache.
 * @param logger - Optional logger instance for debugging cache operations.
 * @returns A CacheManager instance.
 */
export function createCacheManager<T>(logger?: Logger): CacheManager<T> {
  const cache = new Map<string, T>();

  return {
    get size() {
      return cache.size;
    },

    clear(): void {
      cache.clear();
      logger?.debug("Cache cleared");
    },

    set(key: string, entry: T): void {
      cache.set(key, entry);
      logger?.debug(`Cache entry added: ${key}`);
    },

    get(key: string): T | undefined {
      logger?.debug(`Cache: Attempting to get key: ${key}`);
      const entry = cache.get(key);
      if (entry) {
        logger?.debug(`Cache: Found entry for key: ${key}`);
      } else {
        logger?.debug(`Cache: No entry found for key: ${key}`);
      }
      return entry;
    },

    has(key: string): boolean {
      logger?.debug(`Cache: Checking if key exists: ${key}`);
      const exists = cache.has(key);
      logger?.debug(
        `Cache: Key ${key} ${exists ? "exists" : "does not exist"}.`,
      );
      return exists;
    },

    delete(key: string): boolean {
      const deleted = cache.delete(key);
      if (deleted) {
        logger?.debug(`Cache entry removed: ${key}`);
      } else {
        logger?.debug(`Cache: Key ${key} not found for deletion.`);
      }
      return deleted;
    },

    values(): IterableIterator<T> {
      logger?.debug("Cache: Retrieving all values.");
      return cache.values();
    },

    entries(): IterableIterator<[string, T]> {
      logger?.debug("Cache: Retrieving all entries.");
      return cache.entries();
    },
  };
}
