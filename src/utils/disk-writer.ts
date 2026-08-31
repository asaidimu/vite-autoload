import * as fs from "fs/promises";
import * as path from "path";
import { ModuleGenerator } from "../generators/generator";
import { generateModuleCode, generateDefaultExport } from "./codegen";
import type { TransformConfig } from "../types/transform";
import type { BuildContext } from "../types/build";
import { Logger } from "./logger";

/**
 * Writes a single group's generated code to a file on disk.
 * Uses .ts for dev, .js for production builds.
 */
async function writeGroupFile(
  outputDir: string,
  groupName: string,
  code: string,
  logger: Logger,
  isProduction: boolean,
): Promise<void> {
  const ext = isProduction ? "js" : "ts";
  const filePath = path.join(outputDir, `${groupName}.${ext}`);
  await writeFileIfChanged(filePath, code, logger);
}

/**
 * Writes a barrel index file that re-exports all generated groups.
 * Uses .ts for dev, .js for production builds.
 */
async function writeIndexFile(
  outputDir: string,
  groupNames: string[],
  logger: Logger,
  isProduction: boolean,
): Promise<void> {
  const ext = isProduction ? "js" : "ts";
  const lines = groupNames.map((name) => `export * from './${name}';`);
  const code = lines.join("\n") + "\n";
  const filePath = path.join(outputDir, `index.${ext}`);
  await writeFileIfChanged(filePath, code, logger);
}

/**
 * Removes stale generated files in outputDir that no longer correspond to a group.
 */
async function cleanStaleModules(
  outputDir: string,
  currentGroupNames: string[],
  logger: Logger,
): Promise<void> {
  let entries: string[];
  try {
    entries = await fs.readdir(outputDir);
  } catch {
    return; // directory doesn't exist yet, nothing to clean
  }

  const validNames = new Set([...currentGroupNames, "index"]);
  for (const entry of entries) {
    if (!entry.endsWith(".ts") && !entry.endsWith(".js")) continue;
    const name = entry.replace(/\.(ts|js)$/, "");
    if (!validNames.has(name)) {
      const stalePath = path.join(outputDir, entry);
      logger.debug(`Removing stale generated file: ${stalePath}`);
      await fs.unlink(stalePath).catch(() => {});
    }
  }
}

/**
 * Writes a file only if its content has changed.
 */
async function writeFileIfChanged(
  filePath: string,
  content: string,
  logger: Logger,
): Promise<boolean> {
  let existing = "";
  try {
    existing = await fs.readFile(filePath, "utf-8");
  } catch (e: any) {
    if (e.code !== "ENOENT") {
      logger.error(`Error reading ${filePath}:`, e);
      return false;
    }
  }

  if (existing === content) {
    return false;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
  logger.debug(`Wrote ${filePath}`);
  return true;
}

/**
 * Generates code for all groups and writes them as separate files to disk.
 * In dev mode, writes .ts files. In production, writes .js files.
 *
 * @param outputDir - Absolute path to the output directory.
 * @param generators - The module generators.
 * @param context - The build context.
 * @param logger - Logger instance.
 * @returns Array of group names that were written.
 */
export async function generateToDisk(
  outputDir: string,
  generators: ModuleGenerator[],
  context: BuildContext,
  logger: Logger,
): Promise<string[]> {
  const allGroupNames: string[] = [];
  const isProduction = context.production;

  await fs.mkdir(outputDir, { recursive: true });

  for (const generator of generators) {
    const configMap = new Map(
      generator.config.map((c: TransformConfig<any, any, any>) => [
        c.name,
        c,
      ]),
    );

    const data = await generator.data(context);

    for (const [groupName, groupData] of Object.entries(data)) {
      const moduleCode = generateModuleCode(
        groupName,
        groupData,
        configMap.get(groupName),
        logger,
      );
      const defaultExport = generateDefaultExport([groupName], logger);
      const fullCode = moduleCode + defaultExport + "\n";

      await writeGroupFile(outputDir, groupName, fullCode, logger, isProduction);
      allGroupNames.push(groupName);
    }
  }

  await writeIndexFile(outputDir, allGroupNames, logger, isProduction);
  await cleanStaleModules(outputDir, allGroupNames, logger);

  return allGroupNames;
}
