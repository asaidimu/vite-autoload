import * as fs from "fs/promises";
import * as path from "path";

export async function generateTypes(
  outputPath: string,
  types: Record<string, string[]>,
): Promise<void> {
  const content = Object.entries(types)
    .map(([name, values]) => {
      const unionType = values.map((v) => `'${v}'`).join(" | ");
      return `export type ${name} = ${unionType};`;
    })
    .join("\n\n");

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf-8");
}
