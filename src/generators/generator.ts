import type {
  TransformConfig,
  FileMatchConfig,
  ComponentConfig,
  ResolvedFile,
} from "../types";
import { Logger } from "../utils/logger";
import { createCacheManager } from "../utils/cache";
import { createFileResolver } from "../utils/resolver";
import { createDataProcessor } from "../utils/transform";
import { createCodeGenerator } from "../utils/codegen";
import { createUriTransformer } from "../utils/uri";
import { BuildContext } from "../types";

interface GeneratorApi {
  readonly name: string;
  readonly config: ReadonlyArray<TransformConfig<any, any, any>>;
  readonly getModules: (context: {
    production: boolean;
  }) => ReadonlyArray<ResolvedFile>;
  readonly getData: (context: BuildContext) => Record<string, Array<any>>;
  readonly getCode: (context: BuildContext) => string | Record<string, string>;
  readonly hasFile: (file: string) => boolean;
  readonly addFile: (file: string) => void;
  readonly removeFile: (file: string) => void;
  readonly findModule: (searchName: string) => boolean;
}

export function createCollectionGenerator(
  options: ComponentConfig & { logger?: Logger },
): GeneratorApi {
  const { name, groups: config, logger } = options;
  // Initialize pipeline components
  const cache = createCacheManager(logger);
  const fileResolver = createFileResolver({ config, cache, logger });
  const dataProcessor = createDataProcessor({ config });
  const codeGenerator = createCodeGenerator(options);
  const uriTransformer = createUriTransformer();

  // Initialize the file resolver
  fileResolver.initialize();

  function getModules(context: {
    production: boolean;
  }): ReadonlyArray<ResolvedFile> {
    return fileResolver
      .getAllEntries()
      .map((entry) => {
        return entry.files.map((file) => {
          const groupConfig = config.find((c) => c.name === entry.name);
          return {
            ...file,
            uri: uriTransformer.transform({
              uri: file.uri,
              prefix: (groupConfig?.input as FileMatchConfig)?.prefix,
              production: context.production,
            }),
          };
        });
      })
      .flat();
  }

  function getData(context: BuildContext): Record<string, Array<any>> {
    const all = fileResolver.getAllEntries();
    const entries = all
      .filter((f) => context.name === undefined || f.name === context.name)
      .map((f) => f.files)
      .flat();
    logger?.debug(
      `[${name}] getData: Resolved entries count: ${entries.length}`,
    );
    const processedData = dataProcessor.processEntries(entries, context);
    logger?.debug(
      `[${name}] getData: Processed data keys: ${Object.keys(processedData).join(", ")}`,
    );
    return processedData;
  }

  function getCode(context: BuildContext): string | Record<string, string> {
    const data = getData(context);
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

  function findModule(searchName: string): boolean {
    return config.some((c) => c.name === searchName) || searchName === name;
  }

  return {
    name,
    config,
    getModules,
    getData,
    getCode,
    hasFile,
    addFile,
    removeFile,
    findModule,
  };
}

// Legacy API adapter for backward compatibility
export function createModuleGenerator(options: ComponentConfig) {
  const generator = createCollectionGenerator(options);

  return {
    name: generator.name,
    config: generator.config,
    modules: generator.getModules,
    data: generator.getData,
    code: generator.getCode,
    match: generator.hasFile,
    add: generator.addFile,
    remove: generator.removeFile,
    find: generator.findModule,
  };
}

export type ModuleGenerator = ReturnType<typeof createModuleGenerator>;
