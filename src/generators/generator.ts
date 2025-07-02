import type { TransformConfig, ComponentConfig, ResolvedFile, FileMatchConfig } from "../types";
import { Logger } from "../utils/logger";
import { createCacheManager } from "../utils/cache";
import { createFileResolver } from "../utils/resolver";
import { createDataProcessor } from "../utils/transform";
import { createCodeGenerator } from "../utils/codegen";
import { BuildContext } from "../types";
import { createUriTransformer } from "../utils/uri";

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
  const fileResolver = createFileResolver({ config, cache, logger });
  const dataProcessor = createDataProcessor({ config });
  const codeGenerator = createCodeGenerator(options);
  const uriTransformer = createUriTransformer();

  fileResolver.initialize();

  function getGroups(context: BuildContext): ReadonlyArray<ResolvedFile> {
    return fileResolver
      .getAllEntries()
      .map((entry) => {
        const group = options.groups.find((i) => i.name === entry.name);
        return entry.files.map((f) => {
          const transformedUri = uriTransformer.transform({
            uri: f.uri,
            prefix: (group?.input as FileMatchConfig).prefix,
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
    const all = fileResolver.getAllEntries();
    const processedData = await dataProcessor.processEntries(
      all.filter((f) => context.name === undefined || f.name === context.name),
      context,
    );
    return processedData;
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
