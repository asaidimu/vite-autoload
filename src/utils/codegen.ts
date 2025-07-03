import type { TransformConfig } from "../types/transform";
import type { ComponentConfig } from "../types/components";
import type { BuildContext } from "../types/build";
import { Logger } from "./logger";

/**
 * Options for the code generator.
 */
export type CodeGeneratorOptions = ComponentConfig;

/**
 * Interface for a code generator.
 */
export interface CodeGenerator {
  /**
   * Generates code based on the provided data and build context.
   * @param data - The data to use for code generation.
   * @param context - The build context.
   * @returns The generated code as a string.
   */
  readonly generateCode: (
    data: Record<string, Array<any>>,
    context: BuildContext,
  ) => string;
}

/**
 * Generates a code snippet for a single module.
 *
 * @param moduleKey - The key of the module.
 * @param moduleData - The data for the module.
 * @param moduleConfig - The transformation configuration for the module.
 * @param logger - The logger instance.
 * @returns The generated code snippet.
 */
function generateModuleCode(
  moduleKey: string,
  moduleData: any,
  moduleConfig: TransformConfig<any, any, any> | undefined,
  logger?: Logger,
): string {
  logger?.debug(`Generating code for module: ${moduleKey}`);
  const template =
    moduleConfig?.output?.template || `export const ${moduleKey} = {{ data }}`;

  const code = template.replace(
    "{{ data }}",
    JSON.stringify(moduleData, null, 4),
  );
  logger?.debug(
    `Generated code snippet for ${moduleKey}:\n${code.substring(0, 100)}...`,
  );
  return code;
}

/**
 * Generates the default export statement based on module keys.
 * @param moduleKeys An array of module keys.
 * @param logger The logger instance.
 * @returns The generated default export statement.
 */
function generateDefaultExport(moduleKeys: string[], logger?: Logger): string {
  logger?.debug(
    `Generating default export for modules: ${moduleKeys.join(", ")}`,
  );
  if (moduleKeys.length === 1) {
    return `\nexport default ${moduleKeys[0]}`;
  }

  const exportObject = moduleKeys.join(",\n  ");
  return `\nexport default {\n  ${exportObject},\n}`;
}

export function createCodeGenerator(
  options: CodeGeneratorOptions,
  logger: Logger,
): CodeGenerator {
  const { groups: config } = options;
  const configMap = new Map(
    config.map((c: TransformConfig<any, any, any>) => [c.name, c]),
  );

  function generateCode(
    data: Record<string, Array<any>>,
    _: BuildContext,
  ): string {
    logger.debug("Starting code generation...");
    const moduleKeys = Object.keys(data);
    const moduleCode = Object.entries(data).reduce(
      (code, [moduleKey, moduleData]) => {
        const generatedCode = generateModuleCode(
          moduleKey,
          moduleData as any,
          configMap.get(moduleKey),
          logger,
        );
        return code + generatedCode + "\n";
      },
      "",
    );

    const defaultExport = generateDefaultExport(moduleKeys, logger);
    logger.debug("Code generation completed.");
    return moduleCode + defaultExport;
  }

  return { generateCode };
}
