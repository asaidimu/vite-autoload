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
      return cache.get(key);
    },

    has(key: string): boolean {
      return cache.has(key);
    },

    delete(key: string): boolean {
      const deleted = cache.delete(key);
      if (deleted) {
        logger?.debug(`Cache entry removed: ${key}`);
      }
      return deleted;
    },

    values(): IterableIterator<ResolvedFile> {
      return cache.values();
    },

    entries(): IterableIterator<[string, ResolvedFile]> {
      return cache.entries();
    },
  };
}
