import type { ResolvedFile } from "../types";
import { Logger } from "./logger";

export interface CacheManager {
  readonly size: number;
  readonly clear: () => void;
  readonly set: (key: string, entry: ResolvedFile) => void;
  readonly get: (key: string) => ResolvedFile | undefined;
  readonly has: (key: string) => boolean;
  readonly delete: (key: string) => boolean;
  readonly values: () => IterableIterator<ResolvedFile>;
  readonly entries: () => IterableIterator<[string, ResolvedFile]>;
}

export function createCacheManager(logger?: Logger): CacheManager {
  const cache = new Map<string, ResolvedFile>();

  return {
    get size() {
      return cache.size;
    },

    clear(): void {
      cache.clear();
      logger?.debug("Cache cleared");
    },

    set(key: string, entry: ResolvedFile): void {
      cache.set(key, entry);
      logger?.debug(`Cache entry added: ${key}`);
    },

    get(key: string): ResolvedFile | undefined {
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
      logger?.debug(`Cache: Key ${key} ${exists ? 'exists' : 'does not exist'}.`);
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

    values(): IterableIterator<ResolvedFile> {
      logger?.debug("Cache: Retrieving all values.");
      return cache.values();
    },

    entries(): IterableIterator<[string, ResolvedFile]> {
      logger?.debug("Cache: Retrieving all entries.");
      return cache.entries();
    },
  };
}
