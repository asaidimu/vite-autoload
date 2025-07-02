import * as fs from "fs/promises";
import * as path from "path";
import { Logger } from "../utils/logger";

export async function generateTypes(
  outputPath: string,
  types: Record<string, string[]>,
  logger?: Logger,
): Promise<void> {
  logger?.debug(`Generating types to: ${outputPath}`);
  const content = Object.entries(types)
    .map(([name, values]) => {
      const unionType = values.map((v) => `'${v}'`).join(" | ");
      logger?.debug(`Generated type for ${name}: ${unionType.substring(0, 100)}...`);
      return `export type ${name} = ${unionType};`;
    })
    .join("\n\n");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf-8");
  logger?.debug("Types file written successfully.");
}
