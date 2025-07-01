import type { TransformConfig, BuildContext, ComponentConfig } from "../types";

export type CodeGeneratorOptions = ComponentConfig;

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
  ) => string;
}

export class Generator implements CodeGenerationStrategy {
  generate(
    data: Record<string, Array<any>>,
    config: Map<string, TransformConfig<any, any, any>>,
  ): string {
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

    return moduleCode + defaultExport;
  }

  private generateModuleCode(
    moduleKey: string,
    moduleData: any,
    moduleConfig?: TransformConfig<any, any, any>,
  ): string {
    const template =
      moduleConfig?.output?.template ||
      `export const ${moduleKey} = {{ data }};`;

    return template.replace("{{ data }}", JSON.stringify(moduleData, null, 4));
  }

  private generateDefaultExport(moduleKeys: string[]): string {
    if (moduleKeys.length === 1) {
      return `\nexport default ${moduleKeys[0]};`;
    }

    const exportObject = moduleKeys.join(",\n  ");
    return `\nexport default {\n  ${exportObject},\n};`;
  }
}

export function createCodeGenerator(
  options: CodeGeneratorOptions,
): CodeGenerator {
  const { groups: config } = options;
  const configMap = new Map(config.map((c) => [c.name, c]));
  const strategy = new Generator();

  function generateCode(data: Record<string, Array<any>>): string {
    const result = strategy.generate(data, configMap);
    return result;
  }

  return { generateCode };
}
