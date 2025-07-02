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
import { BuildContext } from "../types";
import { createUriTransformer } from "../utils/uri";
import { createDataResolver } from "../utils/data-resolver";

interface GeneratorApi {
  readonly name: string;
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  readonly getGroups: (context: BuildContext) => ReadonlyArray<ResolvedFile>;
  readonly getData: (
    context: BuildContext,
  ) => Promise<Record<string, Array<any>>>;
  readonly getCode: (
    context: BuildContext,
  ) => Promise<string | Record<string, string>>;
  readonly hasFile: (file: string) => boolean;
  readonly addFile: (file: string) => void;
  readonly removeFile: (file: string) => void;
  readonly findGroup: (searchName: string) => boolean;
}

export function createCollectionGenerator(
  options: ComponentConfig & { logger?: Logger },
): GeneratorApi {
  const { name, groups: config, logger } = options;
  const cache = createCacheManager(logger);

  const fileConfigs = config.filter(
    (c) => typeof c.input !== "function",
  ) as TransformConfig<any, any, any>[];
  const dataSourceConfigs = config.filter(
    (c) => typeof c.input === "function",
  ) as TransformConfig<any, any, any>[];

  const fileResolver = createFileResolver({
    config: fileConfigs,
    cache,
    logger,
  });
  const dataResolver = createDataResolver({
    config: dataSourceConfigs,
    logger,
  });

  const dataProcessor = createDataProcessor({ config });
  const codeGenerator = createCodeGenerator(options);
  const uriTransformer = createUriTransformer();

  fileResolver.initialize();
  dataResolver.initialize();

  function getGroups(context: BuildContext): ReadonlyArray<ResolvedFile> {
    return fileResolver
      .getAllEntries()
      .map((entry) => {
        const group = options.groups.find((i) => i.name === entry.name);

        if (!group) {
          return entry.files;
        }

        // Ensure group.input is a FileMatchConfig
        if (
          typeof group.input === "function" ||
          !("directory" in group.input && "match" in group.input)
        ) {
          return entry.files; // Should not happen if filtering is correct, but as a safeguard
        }

        const fileMatchConfig: FileMatchConfig = group.input;

        return entry.files.map((f) => {
          const transformedUri = uriTransformer.transform({
            uri: f.uri,
            prefix: fileMatchConfig.prefix,
            production: context.production,
          });
          return { ...f, uri: transformedUri };
        });
      })
      .flat();
  }

  async function getData(
    context: BuildContext,
  ): Promise<Record<string, Array<any>>> {
    // Helper to apply consistent filtering logic
    const filterByContext = <T>(
      items: Record<string, T>,
    ): Record<string, T> => {
      if (context.name === undefined) return items;

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

    // Get and filter data source entries
    const allDataSourceData = dataResolver.getAllData();
    const dataSourceGroups = filterByContext(allDataSourceData);

    // Process file groups
    const processedFilesData = await dataProcessor.processEntries(
      fileGroups,
      context,
    );

    return { ...processedFilesData, ...dataSourceGroups };
  }

  async function getCode(
    context: BuildContext,
  ): Promise<string | Record<string, string>> {
    const data = await getData(context);
    return codeGenerator.generateCode(data, context);
  }

  function hasFile(file: string): boolean {
    return fileResolver.hasFile(file);
  }

  function addFile(file: string): void {
    logger?.debug(`Adding file to ${name}: ${file}`);
    fileResolver.addFile(file);
  }

  function removeFile(file: string): void {
    logger?.debug(`Removing file from ${name}: ${file}`);
    fileResolver.removeFile(file);
  }

  function findGroup(searchName: string): boolean {
    return config.some((c) => c.name === searchName) || searchName === name;
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
export function createModuleGenerator(options: ComponentConfig) {
  const generator = createCollectionGenerator(options);

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
