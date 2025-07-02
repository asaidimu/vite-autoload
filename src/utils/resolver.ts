import glob from "fast-glob";
import path from "path";
import type {
  TransformConfig,
  FileMatchConfig,
  ResolvedFile,
} from "../types";
import { CacheManager } from "./cache";
import { Logger } from "./logger";
import pico from "picomatch";

export type ResolvedFiles = {
  name: string;
  files: Array<ResolvedFile>;
};

export function resolve(config: FileMatchConfig): Array<ResolvedFile> {
  const ignore = config.ignore
    ? Array.isArray(config.ignore)
      ? config.ignore
      : [config.ignore]
    : (config.ignore as undefined);

  const files = glob.sync(config.match, {
    cwd: config.directory,
    ignore,
    absolute: true,
    onlyFiles: true,
  });

  const result = files.map((file) => {
    const relativePath = path.relative(config.directory, file);
    return {
      path: relativePath,
      uri: path.join(config.directory, relativePath),
      file,
    };
  });

  return result;
}

export interface FileResolverOptions {
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  readonly cache: CacheManager;
  readonly logger?: Logger;
}

export interface FileResolver {
  readonly initialize: () => void;
  readonly addFile: (file: string) => void;
  readonly removeFile: (file: string) => void;
  readonly hasFile: (file: string) => boolean;
  readonly getAllEntries: () => ReadonlyArray<ResolvedFiles>;
}

export function createFileResolver(options: FileResolverOptions): FileResolver {
  const { config, cache, logger } = options;

  const groupCache = new Map<string, Map<string, ResolvedFile>>();

  function initializeGroupCache(): void {
    groupCache.clear();
    for (const groupConfig of config) {
      groupCache.set(groupConfig.name, new Map());
    }
  }

  function initialize(): void {
    try {
      cache.clear();
      initializeGroupCache();

      for (const groupConfig of config) {
        const entries = resolve(groupConfig.input as FileMatchConfig);
        const groupFiles = groupCache.get(groupConfig.name)!;

        for (const entry of entries) {
          cache.set(entry.file, entry);
          groupFiles.set(entry.file, entry);
        }
      }

      const totalFiles = Array.from(groupCache.values()).reduce(
        (sum, group) => sum + group.size,
        0,
      );

      logger?.debug(
        `Resolved ${totalFiles} files across ${config.length} groups`,
      );
    } catch (error) {
      logger?.error("Failed to initialize file resolver", error);
      throw error;
    }
  }

  function addFile(file: string): void {
    logger?.debug(`Adding file: ${file}`);

    for (const groupConfig of config) {
      const { directory, match, ignore } = groupConfig.input as FileMatchConfig;
      const relativeFile = path.relative(directory, file);

      if (pico.isMatch(relativeFile, match, { ignore })) {
        const entry: ResolvedFile = {
          path: relativeFile,
          uri: path.join(directory, relativeFile),
          file,
        };

        cache.set(file, entry);
        const groupFiles = groupCache.get(groupConfig.name)!;
        groupFiles.set(file, entry);

        logger?.debug(`Added ${file} to group ${groupConfig.name}`);
      }
    }
  }

  function removeFile(file: string): void {
    logger?.debug(`Removing file: ${file}`);

    cache.delete(file);

    // Remove from all groups
    for (const groupFiles of groupCache.values()) {
      groupFiles.delete(file);
    }
  }

  function hasFile(file: string): boolean {
    return cache.has(file);
  }

  function getAllEntries(): ReadonlyArray<ResolvedFiles> {
    const result: ResolvedFiles[] = [];
    for (const groupConfig of config) {
      const groupFiles = groupCache.get(groupConfig.name);
      const files = groupFiles ? Array.from(groupFiles.values()) : [];

      result.push({
        name: groupConfig.name,
        files,
      });
    }

    return result;
  }

  return {
    initialize,
    addFile,
    removeFile,
    hasFile,
    getAllEntries,
  };
}
