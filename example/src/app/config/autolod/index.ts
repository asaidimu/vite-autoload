// Adjust import paths based on your file structure after splitting types
import type {
  PluginOptions,
  ComponentConfig,
  TransformConfig,
  ResolvedFile,
  ExtractFunction,
} from "@asaidimu/vite-autoload";
import { z } from "zod";

interface ConfigOptions {
  readonly extract: ExtractFunction;
}

export function createAutoloadConfig({
  extract,
}: ConfigOptions): PluginOptions {
  const widgets: TransformConfig<ResolvedFile, any, any> = {
    name: "widgets",
    description: "Loads application widgets",
    input: {
      directory: "./src/widgets",
      match: ["*.tsx", "*/index.tsx"],
      ignore: ["*.d.ts"],
    },
    output: {
      types: {
        name: "Widgets",
        property: "name",
      },
    },
    transform: async (item: ResolvedFile) => {
      const data = await extract({
        filePath: item.file,
        schema: z.unknown(),
        name: "metadata",
      });
      return {
        ...data,
        path: item.uri,
      };
    },
  };

  const components: ComponentConfig = {
    name: "components",
    description: "Autoloaded widgets",
    strategy: {
      types: {
        name: "Widgets",
        property: "name",
      },
    },
    groups: [widgets],
  };

  return {
    settings: {
      rootDir: process.cwd(),
      export: {
        types: "src/app/types/autogen.d.ts",
      },
      logLevel: "info",
      extract: extract,
    },
    components: [components],
  };
}
