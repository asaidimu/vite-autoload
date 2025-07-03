import type {
  TransformConfig,
  ResolvedFile,
  FileMatchConfig,
} from "../types/transform";
import type { ComponentConfig } from "../types/components";
import { Logger } from "../utils/logger";
import { createCacheManager } from "../utils/cache";
import { createFileResolver } from "../utils/resolver";
import { createDataProcessor } from "../utils/transform";
import { createCodeGenerator } from "../utils/codegen";
import { BuildContext } from "../types/build";
import { createUriTransformer } from "../utils/uri";
import { fnv1a64Hash } from "../utils/hash";
import { createDataResolver } from "../utils/data-resolver";

interface GeneratorApi {
  /** The name of the generator. */
  readonly name: string;
  /** The configuration for the generator. */
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  /**
   * Retrieves resolved files grouped by their configuration.
   * @param context - The build context.
   * @returns An array of resolved files.
   */
  readonly getGroups: (context: BuildContext) => ReadonlyArray<ResolvedFile>;
  /**
   * Retrieves processed data for the generator.
   * @param context - The build context.
   * @returns A promise that resolves to a record of data arrays, keyed by group name.
   */
  readonly getData: (
    context: BuildContext,
  ) => Promise<Record<string, Array<any>>>;
  /**
   * Retrieves generated code for the generator.
   * @param context - The build context.
   * @returns A promise that resolves to the generated code as a string or a record of strings.
   */
  readonly getCode: (
    context: BuildContext,
  ) => Promise<string | Record<string, string>>;
  /**
   * Checks if a file is tracked by the generator.
   * @param file - The file path to check.
   * @returns True if the file is tracked, false otherwise.
   */
  readonly hasFile: (file: string) => boolean;
  /**
   * Adds a file to be tracked by the generator.
   * @param file - The file path to add.
   */
  readonly addFile: (file: string) => void;
  /**
   * Removes a file from being tracked by the generator.
   * @param file - The file path to remove.
   */
  readonly removeFile: (file: string) => void;
  /**
   * Finds a group by its name.
   * @param searchName - The name of the group to find.
   * @returns True if the group is found, false otherwise.
   */
  readonly findGroup: (searchName: string) => boolean;
}

/**
 * Creates a collection generator based on the provided component configuration.
 *
 * @param options - The component configuration.
 * @param logger - The logger instance.
 * @returns A GeneratorApi instance.
 */
export function createCollectionGenerator(
  options: ComponentConfig,
  logger: Logger,
): GeneratorApi {
  const { name, groups: config } = options;
  logger.debug(`Creating collection generator for: ${name}`);
  const dataCache = createCacheManager<Record<string, Array<any>>>(logger);
  const fileCache = createCacheManager<ResolvedFile>(logger);

  const fileConfigs = config.filter(
    (c) => typeof c.input !== "function",
  ) as TransformConfig<any, any, any>[];
  const dataSourceConfigs = config.filter(
    (c) => typeof c.input === "function",
  ) as TransformConfig<any, any, any>[];

  logger.debug(`Initializing file resolver for ${name}...`);
  const fileResolver = createFileResolver({
    config: fileConfigs,
    cache: fileCache,
    logger,
  });
  logger.debug(`Initializing data resolver for ${name}...`);
  const dataResolver = createDataResolver({
    config: dataSourceConfigs,
    logger,
  });

  logger.debug(`Initializing data processor for ${name}...`);
  const dataProcessor = createDataProcessor({ config, logger });
  logger.debug(`Initializing code generator for ${name}...`);
  const codeGenerator = createCodeGenerator(options, logger); // Pass options and logger explicitly
  const uriTransformer = createUriTransformer();

  fileResolver.initialize();
  dataResolver.initialize();
  logger.debug(`Collection generator ${name} initialized.`);

  function getGroups(context: BuildContext): ReadonlyArray<ResolvedFile> {
    logger.debug(
      `Getting groups for ${name} with context: ${JSON.stringify(context)}`,
    );
    return fileResolver
      .getAllEntries()
      .map((entry) => {
        const group = options.groups.find((i) => i.name === entry.name);

        if (!group) {
          logger.debug(
            `No specific group found for entry: ${entry.name}, returning all files.`,
          );
          return entry.files;
        }

        // Ensure group.input is a FileMatchConfig
        if (
          typeof group.input === "function" ||
          !("directory" in group.input && "match" in group.input)
        ) {
          logger.warn(
            `Group ${group.name} has an invalid input configuration.`,
          );
          return entry.files; // Should not happen if filtering is correct, but as a safeguard
        }

        const fileMatchConfig: FileMatchConfig = group.input;

        return entry.files.map((f) => {
          const transformedUri = uriTransformer.transform({
            uri: f.uri,
            prefix: fileMatchConfig.prefix,
            production: context.production,
          });
          logger.debug(
            `Transformed URI for file ${f.path}: ${f.uri} -> ${transformedUri}`,
          );
          return { ...f, uri: transformedUri };
        });
      })
      .flat();
  }

  async function getData(
    context: BuildContext,
  ): Promise<Record<string, Array<any>>> {
    const cacheKey = fnv1a64Hash({
      context,
      fileVersions: Array.from(fileResolver.getVersions().entries()),
      dataVersion: dataResolver.getVersion(),
    });
    if (dataCache.has(cacheKey)) {
      logger.debug(`Returning cached data for ${name} with key: ${cacheKey}`);
      return dataCache.get(cacheKey)!;
    }

    logger.debug(
      `Getting data for ${name} with context: ${JSON.stringify(context)}`,
    );
    // Helper to apply consistent filtering logic
    const filterByContext = <T>(
      items: Record<string, T>,
    ): Record<string, T> => {
      if (context.name === undefined) {
        logger.debug("Context name is undefined, returning all items.");
        return items;
      }

      logger.debug(`Filtering items by context name: ${context.name}`);
      return Object.entries(items)
        .filter(([groupName]) => groupName === context.name)
        .reduce(
          (acc, [groupName, data]) => {
            acc[groupName] = data;
            return acc;
          },
          {} as Record<string, T>,
        );
    };

    // Get and filter file entries
    logger.debug("Getting all file entries...");
    const allFiles = fileResolver.getAllEntries();
    const fileGroups = filterByContext(
      allFiles.reduce(
        (acc, { name, files }) => {
          acc[name] = files;
          return acc;
        },
        {} as Record<string, Array<ResolvedFile>>,
      ),
    );
    logger.debug(
      `File groups after filtering: ${Object.keys(fileGroups).length} groups.`,
    );

    // Get and filter data source entries
    logger.debug("Getting all data source entries...");
    const allDataSourceData = dataResolver.getAllData();
    const dataSourceGroups = filterByContext(allDataSourceData);
    logger.debug(
      `Data source groups after filtering: ${Object.keys(dataSourceGroups).length} groups.`,
    );

    // Process file groups
    logger.debug("Processing file groups...");
    const processedFilesData = await dataProcessor.processEntries(
      fileGroups,
      context,
    );
    logger.debug("File groups processed.");

    const result = { ...processedFilesData, ...dataSourceGroups };
    logger.debug(
      `Data retrieval for ${name} completed. Total groups: ${Object.keys(result).length}`,
    );
    dataCache.set(cacheKey, result);
    return result;
  }

  async function getCode(
    context: BuildContext,
  ): Promise<string | Record<string, string>> {
    logger.debug(
      `Generating code for ${name} with context: ${JSON.stringify(context)}`,
    );
    const data = await getData(context);
    const code = codeGenerator.generateCode(data, context);
    logger.debug(`Code generation for ${name} completed.`);
    return code;
  }

  function hasFile(file: string): boolean {
    logger.debug(`Checking if ${name} has file: ${file}`);
    const result = fileResolver.hasFile(file);
    logger.debug(`File ${file} ${result ? "found" : "not found"} in ${name}.`);
    return result;
  }

  function addFile(file: string): void {
    logger.debug(`Adding file to ${name}: ${file}`);
    fileResolver.addFile(file);
    logger.debug(`File ${file} added to ${name}.`);
  }

  function removeFile(file: string): void {
    logger.debug(`Removing file from ${name}: ${file}`);
    fileResolver.removeFile(file);
    logger.debug(`File ${file} removed from ${name}.`);
  }

  function findGroup(searchName: string): boolean {
    logger.debug(`Searching for group ${searchName} in ${name}.`);
    const result =
      config.some((c) => c.name === searchName) || searchName === name;
    logger.debug(
      `Group ${searchName} ${result ? "found" : "not found"} in ${name}.`,
    );
    return result;
  }

  return {
    name,
    config,
    getGroups,
    getData,
    getCode,
    hasFile,
    addFile,
    removeFile,
    findGroup,
  };
}

// Legacy API adapter for backward compatibility
export function createModuleGenerator(
  options: ComponentConfig,
  logger: Logger,
) {
  const generator = createCollectionGenerator(options, logger);

  return {
    name: generator.name,
    config: generator.config,
    modules: generator.getGroups,
    data: generator.getData,
    code: generator.getCode,
    match: generator.hasFile,
    add: generator.addFile,
    remove: generator.removeFile,
    find: generator.findGroup,
  };
}

export type ModuleGenerator = {
  name: string;
  config: ReadonlyArray<TransformConfig<any, any, any>>;
  modules: (context: BuildContext) => ReadonlyArray<ResolvedFile>;
  data: (context: BuildContext) => Promise<Record<string, Array<any>>>;
  code: (context: BuildContext) => Promise<string | Record<string, string>>;
  match: (file: string) => boolean;
  add: (file: string) => void;
  remove: (file: string) => void;
  find: (searchName: string) => boolean;
};
