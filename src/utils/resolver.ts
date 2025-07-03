import glob from "fast-glob";
import path from "path";
import type {
  TransformConfig,
  FileMatchConfig,
  ResolvedFile,
} from "../types/transform";
import { CacheManager } from "./cache";
import { Logger } from "./logger";
import pico from "picomatch";

/**
 * Represents a collection of resolved files belonging to a specific group.
 */
export type ResolvedFiles = {
  /** The name of the group. */
  name: string;
  /** An array of resolved files within this group. */
  files: Array<ResolvedFile>;
};

/**
 * Resolves files based on a given file match configuration.
 *
 * @param config - The file match configuration.
 * @param logger - Optional logger instance.
 * @returns An array of resolved files.
 */
export function resolve(
  config: FileMatchConfig,
  logger?: Logger,
): Array<ResolvedFile> {
  logger?.debug(
    `Resolving files for directory: ${config.directory}, match: ${config.match}`,
  );
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

  logger?.debug(
    `Found ${files.length} files in ${config.directory} matching ${config.match}`,
  );

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
  /** The transformation configurations that define the file groups. */
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  /** The cache manager for resolved files. */
  readonly cache: CacheManager<ResolvedFile>;
  /** Optional logger instance. */
  readonly logger?: Logger;
}

/**
 * Interface for a file resolver that manages and tracks files based on configurations.
 */
export interface FileResolver {
  /** Initializes the file resolver, populating it with initial files. */
  readonly initialize: () => void;
  /**
   * Adds a file to be tracked by the resolver.
   * @param file - The absolute path of the file to add.
   */
  readonly addFile: (file: string) => void;
  /**
   * Removes a file from being tracked by the resolver.
   * @param file - The absolute path of the file to remove.
   */
  readonly removeFile: (file: string) => void;
  /**
   * Checks if a file is currently tracked by the resolver.
   * @param file - The absolute path of the file to check.
   * @returns True if the file is tracked, false otherwise.
   */
  readonly hasFile: (file: string) => boolean;
  /**
   * Retrieves all resolved file entries, grouped by their configuration.
   * @returns An array of ResolvedFiles objects.
   */
  readonly getAllEntries: () => ReadonlyArray<ResolvedFiles>;
  /**
   * Retrieves the versions of each file group, indicating changes.
   * @returns A Map where keys are group names and values are their versions.
   */
  readonly getVersions: () => Map<string, number>;
}

/**
 * Creates a file resolver instance.
 *
 * @param options - The options for the file resolver.
 * @returns A FileResolver instance.
 */
export function createFileResolver(options: FileResolverOptions): FileResolver {
  const { config, cache, logger } = options;

  const groupCache = new Map<string, Map<string, ResolvedFile>>();
  const _versions = new Map<string, number>();

  function initializeGroupCache(): void {
    groupCache.clear();
    _versions.clear();
    for (const groupConfig of config) {
      groupCache.set(groupConfig.name, new Map());
      _versions.set(groupConfig.name, 0);
    }
  }

  function initialize(): void {
    try {
      cache.clear();
      initializeGroupCache();

      for (const groupConfig of config) {
        logger?.debug(`Resolving files for group: ${groupConfig.name}`);
        const entries = resolve(groupConfig.input as FileMatchConfig, logger);
        const groupFiles = groupCache.get(groupConfig.name)!;

        for (const entry of entries) {
          cache.set(entry.file, entry);
          groupFiles.set(entry.file, entry);
        }
        _versions.set(groupConfig.name, _versions.get(groupConfig.name)! + 1);
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
        _versions.set(groupConfig.name, _versions.get(groupConfig.name)! + 1);
      }
    }
  }

  function removeFile(file: string): void {
    logger?.debug(`Removing file: ${file}`);

    cache.delete(file);

    // Remove from all groups
    for (const groupConfig of config) {
      const groupFiles = groupCache.get(groupConfig.name)!;
      if (groupFiles.delete(file)) {
        _versions.set(groupConfig.name, _versions.get(groupConfig.name)! + 1);
      }
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
    getVersions: () => _versions,
  };
}
