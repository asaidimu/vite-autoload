import * as fs from "fs/promises";
import * as path from "path";
import { Logger } from "../utils/logger"; // Adjusted import path

/**
 * Generates TypeScript type definition files.
 *
 * @param outputPath - The path where the types file will be written.
 * @param types - A record where keys are type names and values are arrays of string literals for the union type.
 * @param logger - Optional logger instance.
 */
export async function generateTypes(
  outputPath: string,
  types: Record<string, string[]>,
  logger?: Logger,
): Promise<void> {
  logger?.debug(`Generating types to: ${outputPath}`);
  const content = Object.entries(types)
    .map(([name, values]) => {
      const unionType = values.map((v) => `'${v}'`).join(" | ");
      const loggableUnionType =
        unionType.length > 100
          ? unionType.substring(0, 100) + "..."
          : unionType;
      logger?.debug(`Generated type for ${name}: ${loggableUnionType}`);
      return `export type ${name} = ${unionType};`;
    })
    .join("\n\n");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  let existingContent = "";
  try {
    existingContent = await fs.readFile(outputPath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      logger?.error(`Error reading existing types file ${outputPath}:`, error);
    }
  }

  if (existingContent !== content) {
    await fs.writeFile(outputPath, content, "utf-8");
    logger?.debug("Types file written successfully.");
  } else {
    logger?.debug(
      `Types file content unchanged, skipping write: ${outputPath}`,
    );
  }
}
