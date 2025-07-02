import type { TransformConfig, BuildContext, ComponentConfig } from "../types";
import { Logger } from "./logger";

export type CodeGeneratorOptions = ComponentConfig & { logger?: Logger };

export interface CodeGenerator {
  readonly generateCode: (
    data: Record<string, Array<any>>,
    context: BuildContext,
  ) => string;
}

export interface CodeGenerationStrategy {
  readonly generate: (
    data: Record<string, Array<any>>,
    config: Map<string, TransformConfig<any, any, any>>,
    logger?: Logger,
  ) => string;
}

export class Generator implements CodeGenerationStrategy {
  constructor(private logger?: Logger) {}

  generate(
    data: Record<string, Array<any>>,
    config: Map<string, TransformConfig<any, any, any>>,
  ): string {
    this.logger?.debug("Starting code generation...");
    const moduleKeys = Object.keys(data);
    // Generate individual module exports
    const moduleCode = Object.entries(data).reduce(
      (code, [moduleKey, moduleData]) => {
        const generatedCode = this.generateModuleCode(
          moduleKey,
          moduleData,
          config.get(moduleKey),
        );
        return code + generatedCode + "\n";
      },
      "",
    );

    // Generate appropriate default export
    const defaultExport = this.generateDefaultExport(moduleKeys);

    this.logger?.debug("Code generation completed.");
    return moduleCode + defaultExport;
  }

  private generateModuleCode(
    moduleKey: string,
    moduleData: any,
    moduleConfig?: TransformConfig<any, any, any>,
  ): string {
    this.logger?.debug(`Generating code for module: ${moduleKey}`);
    const template =
      moduleConfig?.output?.template ||
      `export const ${moduleKey} = {{ data }}`;

    const code = template.replace("{{ data }}", JSON.stringify(moduleData, null, 4));
    this.logger?.debug(`Generated code snippet for ${moduleKey}:\n${code.substring(0, 100)}...`);
    return code;
  }

  private generateDefaultExport(moduleKeys: string[]): string {
    this.logger?.debug(`Generating default export for modules: ${moduleKeys.join(", ")}`);
    if (moduleKeys.length === 1) {
      return `\nexport default ${moduleKeys[0]}`;
    }

    const exportObject = moduleKeys.join(",\n  ");
    return `\nexport default {\n  ${exportObject},\n}`;
  }
}

export function createCodeGenerator(
  options: CodeGeneratorOptions,
): CodeGenerator {
  const { groups: config, logger } = options;
  const configMap = new Map(config.map((c) => [c.name, c]));
  const strategy = new Generator(logger);

  function generateCode(data: Record<string, Array<any>>): string {
    const result = strategy.generate(data, configMap);
    return result;
  }

  return { generateCode };
}
